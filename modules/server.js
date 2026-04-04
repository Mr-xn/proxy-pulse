/**
 * ProxyServer - 本地代理服务模块
 * 提供 HTTP (端口 1801) 和 SOCKS5 (端口 1800) 双协议代理服务
 */
const net = require('net');
const { SocksClient } = require('socks');
const EventEmitter = require('events');

class ProxyServer extends EventEmitter {
  constructor(httpHost, httpPort, socks5Host, socks5Port, rotator) {
    super();
    this._rotator = rotator;
    this._running = false;
    this.rotatePerRequest = false;

    // HTTP 服务
    this._httpHost = httpHost;
    this._httpPort = httpPort;
    this._httpServer = null;

    // SOCKS5 服务
    this._socks5Host = socks5Host;
    this._socks5Port = socks5Port;
    this._socks5Server = null;
  }

  log(message) {
    this.emit('log', `[Server] ${message}`);
  }

  setRotationMode(perRequest) {
    this.rotatePerRequest = perRequest;
    const mode = perRequest ? '逐请求轮换' : '固定当前';
    this.log(`轮换模式切换为: ${mode}`);
  }

  /**
   * 启动所有代理服务
   */
  startAll() {
    if (this._running) return;
    this._running = true;

    // HTTP 服务
    this._httpServer = net.createServer(this._handleHttpClient.bind(this));
    this._httpServer.listen(this._httpPort, this._httpHost, () => {
      this.log(`HTTP 代理服务已启动于 ${this._httpHost}:${this._httpPort}`);
    });

    // SOCKS5 服务
    this._socks5Server = net.createServer(this._handleSocks5Client.bind(this));
    this._socks5Server.listen(this._socks5Port, this._socks5Host, () => {
      this.log(`SOCKS5 代理服务已启动于 ${this._socks5Host}:${this._socks5Port}`);
    });
  }

  /**
   * 停止所有代理服务
   */
  stopAll() {
    if (!this._running) return;
    this._running = false;

    if (this._httpServer) {
      this._httpServer.close();
      this._httpServer = null;
    }
    if (this._socks5Server) {
      this._socks5Server.close();
      this._socks5Server = null;
    }

    this.log('所有代理服务已停止');
    this.emit('stopped');
  }

  /**
   * 获取上游代理连接
   */
  async _getUpstreamConnection(targetHost, targetPort) {
    const upstreamProxyInfo = this.rotatePerRequest 
      ? this._rotator.getNextProxy()
      : this._rotator.getCurrentProxy();

    if (!upstreamProxyInfo) {
      this.log('[!] 代理池为空，无法转发请求。');
      return null;
    }

    const { proxy: addr, protocol } = upstreamProxyInfo;
    const [upstreamAddr, upstreamPortStr] = addr.split(':');

    try {
      let proxyOptions = {
        proxy: {
          host: upstreamAddr,
          port: parseInt(upstreamPortStr),
          type: 5 // 默认 SOCKS5
        },
        destination: {
          host: targetHost,
          port: targetPort
        },
        command: 'connect',
        timeout: 10000
      };

      // 根据协议设置类型
      const protoUpper = protocol.toUpperCase();
      if (protoUpper === 'HTTP') {
        proxyOptions.proxy.type = 5; // HTTP CONNECT 用 SOCKS 方式模拟
      } else if (protoUpper === 'SOCKS4') {
        proxyOptions.proxy.type = 4;
      } else {
        proxyOptions.proxy.type = 5; // SOCKS5
      }

      const info = await SocksClient.createConnection(proxyOptions);
      
      if (this.rotatePerRequest) {
        this.log(`轮换: ${addr} -> ${targetHost}:${targetPort}`);
      }

      return info.socket;
    } catch (e) {
      this.log(`[!] 上游代理 ${addr} 错误: ${e.message}`);
      return null;
    }
  }

  /**
   * 处理 HTTP 客户端连接
   */
  async _handleHttpClient(clientSocket) {
    let remoteSocket = null;
    
    try {
      // 接收请求数据（超时 10 秒）
      const requestData = await this._recvWithTimeout(clientSocket, 8192, 10000);
      if (!requestData || requestData.length === 0) return;

      const firstLine = requestData.toString().split('\r\n')[0];
      const [method, urlStr] = firstLine.split(' ');

      let targetHost, targetPort;

      if (method === 'CONNECT') {
        // HTTPS 隧道模式
        [targetHost, targetPortStr] = urlStr.split(':');
        targetPort = parseInt(targetPortStr);
      } else {
        // 普通 HTTP 请求
        let parsed;
        try {
          parsed = new URL(urlStr);
        } catch (e) {
          // 相对路径，尝试从 Host 头获取
          const hostMatch = requestData.toString().match(/Host:\s*([^\r\n]+)/);
          if (hostMatch) {
            const hostPort = hostMatch[1].split(':');
            targetHost = hostPort[0];
            targetPort = hostPort[1] ? parseInt(hostPort[1]) : 80;
          } else return;
        }
        if (parsed && !targetHost) {
          targetHost = parsed.hostname;
          targetPort = parsed.port || 80;
        }
      }

      remoteSocket = await this._getUpstreamConnection(targetHost, targetPort);
      if (!remoteSocket) {
        clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
        clientSocket.end();
        return;
      }

      if (method === 'CONNECT') {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      } else {
        remoteSocket.write(requestData);
      }

      this._forwardData(clientSocket, remoteSocket);

    } catch (e) {
      if (!['ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(e.code)) {
        this.log(`处理 HTTP 请求时出错: ${e.message}`);
      }
    } finally {
      if (remoteSocket && !remoteSocket.destroyed) remoteSocket.destroy();
      if (!clientSocket.destroyed) clientSocket.destroy();
    }
  }

  /**
   * 处理 SOCKS5 客户端连接
   */
  async _handleSocks5Client(clientSocket) {
    let remoteSocket = null;

    try {
      // 第一步：读取握手请求
      const greeting = await this._recvWithTimeout(clientSocket, 2, 10000);
      if (!greeting || greeting.length < 2 || greeting[0] !== 0x05) return;
      
      const nmethods = greeting[1];
      await this._recvWithTimeout(clientSocket, nmethods); // 丢弃方法列表

      // 发送：选择无认证方式
      clientSocket.write(Buffer.from([0x05, 0x00]));

      // 第二步：读取连接请求
      const connReq = await this._recvWithTimeout(clientSocket, 4, 10000);
      if (!connReq || connReq[0] !== 0x05 || connReq[1] !== 0x01) return;

      const atyp = connReq[3];
      let addr;
      
      if (atyp === 0x01) {
        // IPv4
        const ipBuf = await this._recvWithTimeout(clientSocket, 4);
        addr = Array.from(ipBuf).join('.');
      } else if (atyp === 0x03) {
        // 域名
        const domainLenBuf = await this._recvWithTimeout(clientSocket, 1);
        const domainLen = domainLenBuf[0];
        const domainBuf = await this._recvWithTimeout(clientSocket, domainLen);
        addr = domainBuf.toString('utf-8');
      } else {
        // IPv6 不支持
        clientSocket.write(Buffer.from([0x05, 0x08, 0x00, 0x01, 
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
        return;
      }

      // 读取目标端口
      const portBuf = await this._recvWithTimeout(clientSocket, 2);
      const targetPort = (portBuf[0] << 8) | portBuf[1];

      // 连接上游
      remoteSocket = await this._getUpstreamConnection(addr, targetPort);
      if (!remoteSocket) {
        clientSocket.write(Buffer.from([0x05, 0x04, 0x00, 0x01,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
        return;
      }

      // 发送成功响应
      clientSocket.write(Buffer.from([0x05, 0x00, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));

      // 开始转发数据
      this._forwardData(clientSocket, remoteSocket);

    } catch (e) {
      if (!['ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(e.code)) {
        this.log(`处理 SOCKS5 请求时出错: ${e.message}`);
      }
    } finally {
      if (remoteSocket && !remoteSocket.destroyed) remoteSocket.destroy();
      if (!clientSocket.destroyed) clientSocket.destroy();
    }
  }

  /**
   * 在两个 socket 之间双向转发数据
   */
  _forwardData(sock1, sock2) {
    sock1.pipe(sock2);
    sock2.pipe(sock1);

    sock1.on('error', () => {
      sock1.unpipe(sock2);
      sock2.unpipe(sock1);
      if (!sock2.destroyed) sock2.destroy();
    });

    sock2.on('error', () => {
      sock2.unpipe(sock1);
      sock1.unpipe(sock2);
      if (!sock1.destroyed) sock1.destroy();
    });
  }

  /**
   * 带超时的接收数据辅助函数
   */
  _recvWithTimeout(socket, size, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const bufferList = [];
      let totalSize = 0;

      const timer = setTimeout(() => {
        socket.removeListener('data', onData);
        socket.removeListener('end', onEnd);
        socket.removeListener('error', onError);
        reject(new Error('ETIMEDOUT'));
      }, timeout);

      function onData(data) {
        bufferList.push(data);
        totalSize += data.length;
        
        if (totalSize >= size || !size) {
          clearTimeout(timer);
          socket.removeListener('data', onData);
          socket.removeListener('end', onEnd);
          socket.removeListener('error', onError);
          resolve(Buffer.concat(bufferList));
        }
      }

      function onEnd() {
        clearTimeout(timer);
        socket.removeListener('data', onData);
        socket.removeListener('error', onError);
        resolve(Buffer.concat(bufferList));
      }

      function onError(err) {
        clearTimeout(timer);
        socket.removeListener('data', onData);
        socket.removeListener('end', onEnd);
        reject(err);
      }

      socket.on('data', onData);
      socket.on('end', onEnd);
      socket.on('error', onError);
    });
  }
}

module.exports = ProxyServer;
