/**
 * ProxyChecker - 代理验证模块
 * TCP 预检 + 延迟/匿名度/速度/地理位置检测
 */
const axios = require('axios');
const net = require('net');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

class ProxyChecker {
  constructor(timeout = 5) {
    this.timeout = timeout;
    this.session = axios.create({
      timeout: timeout * 1000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
      }
    });
    
    this.validationTargets = {
      latencyCheck: 'https://www.baidu.com',
      anonymityCheck: 'http://httpbin.org/get?show_env=1',
      speedCheck: 'http://cachefly.cachefly.net/100kb.test',
    };

    // 国家名称中文映射
    this.countryNameMap = {
      'China': '中国', 'Hong Kong': '香港', 'Singapore': '新加坡',
      'United States': '美国', 'Japan': '日本', 'South Korea': '韩国',
      'Russia': '俄罗斯', 'Germany': '德国', 'United Kingdom': '英国',
      'France': '法国', 'Canada': '加拿大', 'Taiwan': '台湾',
      'Netherlands': '荷兰', 'India': '印度', 'Vietnam': '越南',
      'Thailand': '泰国', 'Brazil': '巴西', 'Australia': '澳大利亚'
    };
    
    this.locationCache = {};
    this.publicIp = null;
  }

  /**
   * 获取本机公网 IP
   */
  async initializePublicIp(logFn) {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 10000 });
      const ip = response.data.ip;
      if (ip) {
        this.publicIp = ip;
        if (logFn) logFn(`[Checker] 本机公网IP: ${this.publicIp}`);
      }
    } catch (e) {
      if (logFn) logFn(`[Checker] 获取本机公网IP失败: ${e.message}`);
    }
  }

  /**
   * 查询 IP 地理位置（带缓存）
   */
  async _getProxyLocation(ip) {
    if (this.locationCache[ip]) return this.locationCache[ip];
    
    let location = '未知';

    // API 1: ip-api.com
    try {
      const res = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,message,country`, { timeout: 2000 });
      const data = res.data;
      if (data.status === 'success' && data.country) {
        location = this.countryNameMap[data.country] || data.country;
        this.locationCache[ip] = location;
        return location;
      }
    } catch (e) { /* 继续尝试 */ }

    // API 2: ip.sb GeoIP
    try {
      const res = await axios.get(`https://api.ip.sb/geoip/${ip}`, { timeout: 3000 });
      const data = res.data;
      if (data.country) {
        location = this.countryNameMap[data.country] || data.country;
        this.locationCache[ip] = location;
        return location;
      }
    } catch (e) { /* 继续尝试 */ }

    this.locationCache[ip] = location;
    return location;
  }

  /**
   * TCP 预检 - 快速判断端口是否开放
   */
  _preCheckProxy(proxy) {
    return new Promise((resolve) => {
      // 安全解析端口，防止NaN导致crash
      const lastColon = proxy.lastIndexOf(':');
      if (lastColon <= 0) { resolve(false); return; }
      const host = proxy.substring(0, lastColon);
      const port = parseInt(proxy.substring(lastColon + 1));
      if (isNaN(port) || port <= 0 || port >= 65536) { resolve(false); return; }
      
      const socket = new net.Socket();
      socket.setTimeout(1500);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }

  /**
   * 创建代理 Agent
   */
  _createAgent(proxyUrl, protocol) {
    try {
      const lowerProto = protocol.toLowerCase();
      if (lowerProto === 'socks5' || lowerProto === 'socks4') {
        return new SocksProxyAgent(proxyUrl);
      } else if (proxyUrl.startsWith('https')) {
        return new HttpsProxyAgent(proxyUrl);
      } else {
        return new HttpProxyAgent(proxyUrl);
      }
    } catch (e) {
      return null;
    }
  }

  /**
   * 完整代理质量检测
   */
  async _fullCheckProxy(proxyInfo, cancelFlag = { cancelled: false }) {
    const proxy = proxyInfo.proxy;
    const protocol = proxyInfo.protocol;
    const proxyUrl = `${protocol.toLowerCase()}://${proxy}`;
    // 安全解析IP和端口，处理各种异常格式
    const lastColon = proxy.lastIndexOf(':');
    const ip = lastColon > 0 ? proxy.substring(0, lastColon) : proxy;
    const portStr = lastColon > 0 ? proxy.substring(lastColon + 1) : '0';
    const port = parseInt(portStr);
    // 端口无效则直接返回失败，不抛异常
    if (isNaN(port) || port < 0 || port >= 65536) {
      return { proxy, ip, port: 0, protocol: protocol.toUpperCase(), status: 'Failed', latency: Infinity, speed: 0, anonymity: 'Unknown', location: 'N/A' };
    }

    const result = {
      proxy,
      ip,
      port,
      protocol: protocol.toUpperCase(),
      status: 'Failed',
      latency: Infinity,
      speed: 0,
      anonymity: 'Unknown',
      location: 'N/A'
    };

    try {
      if (cancelFlag.cancelled) return null;

      // 1. 延迟测试
      const agent = this._createAgent(proxyUrl, protocol);
      if (!agent) return result;

      const startTime = Date.now();
      await this.session.head(this.validationTargets.latencyCheck, {
        httpAgent: agent,
        httpsAgent: agent,
        validateStatus: () => true
      });
      result.latency = (Date.now() - startTime) / 1000;

      if (cancelFlag.cancelled) return null;

      // 2. 匿名度检测
      const anonAgent = this._createAgent(proxyUrl, protocol);
      const anonRes = await this.session.get(this.validationTargets.anonymityCheck, {
        httpAgent: anonAgent,
        httpsAgent: anonAgent,
        validateStatus: () => true
      });
      
      const anonData = anonRes.data;
      const originIpsStr = (anonData.headers && anonData.headers['X-Forwarded-For']) || 
                           anonData.origin || '';
      const originIps = originIpsStr.split(',').map(ip => ip.trim());

      if (this.publicIp && originIps.some(ip => ip === this.publicIp)) {
        result.anonymity = 'Transparent';
        return result;
      } else if (originIps.length > 1 || (anonData.headers && anonData.headers['Via'])) {
        result.anonymity = 'Anonymous';
      } else {
        result.anonymity = 'Elite';
      }

      if (cancelFlag.cancelled) return null;

      // 3. 速度测试（仅延迟 < 7秒 的代理）
      if (result.latency <= 7.0) {
        try {
          const speedAgent = this._createAgent(proxyUrl, protocol);
          const startSpeed = Date.now();
          const speedRes = await this.session.get(this.validationTargets.speedCheck, {
            httpAgent: speedAgent,
            httpsAgent: speedAgent,
            responseType: 'arraybuffer',
            validateStatus: () => true,
            timeout: 15000
          });
          const contentSize = speedRes.data.length || speedRes.data.byteLength || 0;
          const speedDuration = (Date.now() - startSpeed) / 1000;
          if (speedDuration > 0 && contentSize > 0) {
            result.speed = (contentSize / speedDuration) * 8 / (1000 * 1000); // Mbps
          }
        } catch (e) {
          // 测速失败不影响结果
        }
      }

      if (cancelFlag.cancelled) return null;

      // 4. 地理位置
      result.location = await this._getProxyLocation(proxy.split(':')[0]);

      result.status = 'Working';
      return result;

    } catch (e) {
      return result;
    }
  }

  /**
   * 计算代理分数
   */
  calculateScore(proxyInfo) {
    let score = 0;
    if (proxyInfo.latency !== Infinity) score += (1 / proxyInfo.latency) * 50;
    score += (proxyInfo.speed || 0) * 10;
    if (proxyInfo.anonymity === 'Elite') score += 50;
    else if (proxyInfo.anonymity === 'Anonymous') score += 20;
    proxyInfo.score = Math.round(score * 100) / 100;
    return proxyInfo.score;
  }

  /**
   * 批量验证所有代理
   */
  async validateAll(proxiesByProtocol, resultHandler, logFn, validationMode = 'online', 
                     maxWorkers = 100, cancelFlag = { cancelled: false }) {
    
    // 扁平化所有代理
    const allProxies = [];
    for (const [proto, proxies] of Object.entries(proxiesByProtocol)) {
      for (const p of proxies) {
        allProxies.push({ proxy: p, protocol: proto });
      }
    }

    const total = allProxies.length;
    logFn(`[*] 开始验证 ${total} 个代理...`);

    // 阶段一：TCP预检，分批并发避免耗尽系统资源
    let survivors = allProxies;
    if (total > 0) {
      logFn(`[*] 阶段一：TCP预检开始，总数: ${total}...`);
      const precheckBatchSize = Math.min(500, total); // 每批最多500个并发
      const precheckResults = [];
      for (let i = 0; i < total; i += precheckBatchSize) {
        if (cancelFlag.cancelled) break;
        const batch = allProxies.slice(i, i + precheckBatchSize);
        const batchResults = await Promise.all(
          batch.map(p => this._preCheckProxy(p.proxy))
        );
        precheckResults.push(...batchResults);
      }
      survivors = allProxies.filter((_, i) => precheckResults[i]);
      logFn(`[+] 阶段一：TCP预检完成，幸存者: ${survivors.length} / ${total}`);
    }

    if (cancelFlag.cancelled) {
      log('[Checker] 任务在TCP预检后被用户取消。');
      return;
    }

    // 阶段二：完整质量验证
    logFn(`\n${'='.repeat(20)} 阶段二：开始完整质量验证 ${'='.repeat(20)}`);
    
    if (survivors.length === 0) {
      if (resultHandler) resultHandler(null); // 结束信号
      return;
    }

    // 并发控制：使用分批处理模拟线程池
    const batchSize = maxWorkers;
    for (let i = 0; i < survivors.length; i += batchSize) {
      if (cancelFlag.cancelled) break;
      
      const batch = survivors.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(p => this._fullCheckProxy(p, cancelFlag))
      );

      for (const r of results) {
        if (cancelFlag.cancelled) break;
        if (r.status === 'fulfilled' && r.value !== null) {
          this.calculateScore(r.value);
          if (resultHandler) resultHandler(r.value);
        }
      }
    }

    if (!cancelFlag.cancelled && resultHandler) {
      resultHandler(null); // 正常结束信号
    }
  }
}

module.exports = ProxyChecker;
