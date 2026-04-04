/**
 * Fir-Proxy Node - 高可用 HTTP/SOCKS5 代理池程序
 * Node.js 版主入口文件
 * 
 * 使用方法:
 *   npm install
 *   npm start
 * 
 * 然后浏览器打开 http://localhost:3456
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { EventEmitter } = require('events');

// 导入自定义模块
const ProxyFetcher = require('./modules/fetcher');
const ProxyChecker = require('./modules/checker');
const ProxyRotator = require('./modules/rotator');
const ProxyServer = require('./modules/server');

// ==================== App Setup ====================
const app = express();
const PORT = process.env.PORT || 3456;
const HTTP_PROXY_PORT = 1801;
const SOCKS5_PROXY_PORT = 1800;

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 清空日志 API
app.post('/api/logs/clear', (req, res) => {
  if (state.logStreamCallback) {
    state.logStreamCallback({ message: '--- Logs cleared by user ---', level: 'warn' });
  }
  res.json({ success: true });
});

// 文件上传配置 (用于导入代理)
const upload = multer({
  dest: path.join(__dirname, 'temp'),
  limits: { fileSize: 10 * 1024 * 1024 } // 最大 10MB
});

// ==================== Core Components ====================
const fetcher = new ProxyFetcher();
const checker = new ProxyChecker();
const rotator = new ProxyRotator();

let proxyServer = null;

// 全局状态
const state = {
  isRunningTask: false,
  cancelFlag: { cancelled: false },
  resultsBuffer: [],       // 验证结果缓冲区
  progress: { current: 0, max: 0 },
  taskFinished: false,
  logEmitter: new EventEmitter(),
  settings: {
    general: {
      validationThreads: 100,
      failureThreshold: 3,
      autoRetestEnabled: false,
      autoRetestInterval: 10
    }
  }
};

// ==================== Log System ====================
function log(message, level = 'normal') {
  const entry = {
    message,
    level,
    timestamp: new Date().toISOString()
  };
  state.logEmitter.emit('log', JSON.stringify(entry));
  
  // 同时输出到控制台
  const prefixMap = {
    success: '[✅]',
    error: '[❌]',
    warn: '[⚠️]',
    info: '[ℹ️]'
  };
  console.log(`${prefixMap[level] || ''} ${message}`);
}

// ==================== API Routes ====================

/**
 * 获取日志流 (SSE)
 */
app.get('/api/logs/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send recent logs first
  const welcomeMsg = { message: '日志流已连接...', level: 'info' };
  res.write(`data: ${JSON.stringify(welcomeMsg)}\n\n`);

  const onLog = (data) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (e) {
      // Client disconnected
    }
  };

  state.logEmitter.on('log', onLog);

  req.on('close', () => {
    state.logEmitter.removeListener('log', onLog);
  });
});

/**
 * 开始获取并验证代理
 */
app.post('/api/fetch/start', async (req, res) => {
  if (state.isRunningTask) {
    return res.json({ error: '已有任务在运行中' });
  }

  state.isRunningTask = true;
  state.cancelFlag.cancelled = false;
  state.resultsBuffer = [];
  state.progress = { current: 0, max: 0 };
  state.taskFinished = false;

  log(`${'='.repeat(20)} 步骤 1: 开始获取在线免费代理 ${'='.repeat(20)}`);

  // 异步执行获取+验证任务（不阻塞响应）
  runFetchAndValidate();

  res.json({ status: 'started' });
});

async function runFetchAndValidate() {
  try {
    const proxiesByProtocol = await fetcher.fetchAll(log, state.cancelFlag);

    if (state.cancelFlag.cancelled) {
      finishTask();
      return;
    }

    // 过滤出只有数组的协议字段（排除 total 等非数组属性）
    const protocolEntries = Object.entries(proxiesByProtocol).filter(([k, v]) => Array.isArray(v));
    const totalToValidate = protocolEntries.reduce((sum, [, v]) => sum + v.length, 0);
    const proxiesForValidation = {};
    for (const [k, v] of protocolEntries) {
      proxiesForValidation[k] = v;
    }
    
    state.progress.max = totalToValidate;
    log(`[*] 共获取 ${proxiesByProtocol.total || totalToValidate} 个原始代理，开始验证...`);

    await checker.validateAll(
      proxiesForValidation,
      handleValidationResult,
      log,
      'online',
      state.settings.general.validationThreads,
      state.cancelFlag
    );

    if (!state.cancelFlag.cancelled) {
      finishTask();
    }

  } catch (e) {
    log(`[!] 任务出错: ${e.message}`, 'error');
    finishTask();
  }
}

function handleValidationResult(result) {
  if (result === null) {
    // 结束信号 - 在 validateAll 内部处理
    return;
  }

  state.progress.current++;
  state.resultsBuffer.push(result);

  // 添加到轮换器（去重）
  if (result.status === 'Working') {
    rotator.addProxy(result);
  }
}

function finishTask() {
  state.isRunningTask = false;
  state.taskFinished = true;
  
  const workingCount = rotator.getActiveProxiesCount();
  const totalInRotator = rotator.getAllProxiesForRevalidation().length;
  log(`\n${'='.repeat(20)} 任务全部完成 ${'='.repeat(20)}`);
  log(`代理池现有 ${workingCount} 个可用的代理。`, workingCount > 0 ? 'success' : 'warn');
}

/**
 * 获取验证结果（轮询用）
 */
app.get('/api/fetch/results', (req, res) => {
  const results = [...state.resultsBuffer];
  state.resultsBuffer = []; // 清空已读取的结果

  res.json({
    results,
    progress: state.progress,
    finished: state.taskFinished && !state.isRunningTask
  });

  // 如果任务已完成且结果为空，重置 finished 标志避免重复通知
  if (state.taskFinished && !state.isRunningTask && results.length === 0) {
    // Keep finished=true for one more poll cycle to let frontend know
  }
});

/**
 * 取消当前任务
 */
app.post('/api/fetch/cancel', (req, res) => {
  state.cancelFlag.cancelled = true;
  state.isRunningTask = false;
  log('\n' + '='.repeat(20) + ' 任务已被用户取消 ' + '='.repeat(20), 'warn');
  res.json({ success: true });
});

/**
 * 导入代理文件
 */
app.post('/api/proxy/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.json({ success: false, error: '未上传文件' });

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const proxiesByProtocol = { http: [], socks4: [], socks5: [] };

    if (ext === '.json') {
      const data = JSON.parse(fileContent);
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        let urlStr = item.url || '';
        let protocol = (item.protocol || 'http').toLowerCase();
        
        if (!urlStr && item.ip && item.port) {
          urlStr = `${item.ip}:${item.port}`;
        }
        if (!urlStr) continue;

        // 解析 URL
        const urlMatch = urlStr.match(/(\w+):\/\/(.+)/);
        if (urlMatch) {
          protocol = urlMatch[1].toLowerCase() === 'https' ? 'http' : urlMatch[1].toLowerCase();
          urlStr = urlMatch[2];
        }
        
        const proxyPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}$/;
        if (proxyPattern.test(urlStr)) {
          if (protocol in proxiesByProtocol) proxiesByProtocol[protocol].push(urlStr);
        }
      }
    } else {
      // TXT 格式
      const lines = fileContent.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;
        
        let protocol = 'http';
        let proxyAddr = trimmedLine;
        
        // 检查协议前缀
        const protoMatch = trimmedLine.match(/^(\w+):\/\/(.+)/);
        if (protoMatch) {
          const protoLower = protoMatch[1].toLowerCase();
          if (['http', 'https', 'socks4', 'socks5'].includes(protoLower)) {
            protocol = protoLower === 'https' ? 'http' : protoLower;
            proxyAddr = protoMatch[2];
          }
        } else if (trimmedLine.includes(',')) {
          // "protocol,address" 格式
          const parts = trimmedLine.split(',');
          if (parts.length >= 2) {
            const p = parts[0].trim().toLowerCase();
            if (['http', 'https', 'socks4', 'socks5'].includes(p)) {
              protocol = p === 'https' ? 'http' : p;
              proxyAddr = parts[1].trim();
            }
          }
        }

        const proxyPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}$/;
        if (proxyPattern.test(proxyAddr) && protocol in proxiesByProtocol) {
          proxiesByProtocol[protocol].push(proxyAddr);
        }
      }
    }

    const totalCount = Object.values(proxiesByProtocol).reduce((a, b) => a + b.length, 0);
    
    if (totalCount === 0) {
      return res.json({ success: false, error: '文件中没有找到有效格式的代理' });
    }

    // 清理临时文件
    try { fs.unlinkSync(filePath); } catch (e) {}

    // 开始验证任务
    state.isRunningTask = true;
    state.cancelFlag.cancelled = false;
    state.resultsBuffer = [];
    state.progress = { current: 0, max: totalCount };
    state.taskFinished = false;

    log(`成功导入 ${totalCount} 个代理，开始验证...`);

    // 异步执行验证
    setImmediate(async () => {
      await checker.validateAll(
        proxiesByProtocol,
        handleValidationResult,
        log,
        'import',
        state.settings.general.validationThreads,
        state.cancelFlag
      );
      if (!state.cancelFlag.cancelled) finishTask();
    });

    res.json({ success: true, count: totalCount });

  } catch (error) {
    log(`导入失败: ${error.message}`, 'error');
    res.json({ success: false, error: error.message });
  }
});

/**
 * 清空所有代理
 */
app.post('/api/proxy/clear', (req, res) => {
  rotator.clear();
  state.resultsBuffer = []; // Also clear the buffer since we cleared everything
  
  // Clear displayed proxies tracking by removing all from buffer
  // The frontend will also need to clear its list
  
  log('所有代理已清空');
  res.json({ success: true });
});

/**
 * 全部重新验证
 */
app.post('/api/proxy/revalidate', async (req, res) => {
  if (state.isRunningTask) return res.json({ error: '已有任务在运行' });

  const allProxiesInfo = rotator.getAllProxiesForRevalidation();
  if (allProxiesInfo.length === 0) {
    return res.json({ error: '代理池为空' });
  }

  state.isRunningTask = true;
  state.cancelFlag.cancelled = false;
  state.resultsBuffer = [];
  state.taskFinished = false;

  // 按分数排序（优先验证高分的）
  allProxiesInfo.sort((a, b) => (b.score || 0) - (a.score || 0));

  // 按 protocol 分组
  const grouped = {};
  for (const p of allProxiesInfo) {
    const proto = (p.protocol || 'http').toLowerCase();
    if (!grouped[proto]) grouped[proto] = [];
    grouped[proto].push(p.proxy);
  }

  log(`${'='.repeat(20)} 开始重新验证所有代理 ${'='.repeat(20)}`);
  
  res.json({ started: true, count: allProxiesInfo.length });

  setImmediate(async () => {
    await checker.validateAll(
      grouped,
      (result) => {
        if (result === null) return;
        state.progress.current++;
        state.resultsBuffer.push(result);
        
        // 更新或移除代理
        if (result.status === 'Working') {
          rotator.updateProxy(result.proxy, {
            score: result.score,
            status: 'Working',
            latency: result.latency,
            speed: result.speed,
            anonymity: result.anonymity,
            location: result.location,
            consecutiveFailures: 0
          });
        } else {
          // 增加失败计数
          const existing = rotator.getProxyByAddress(result.proxy);
          if (existing) {
            const newFailures = (existing.consecutiveFailures || 0) + 1;
            if (newFailures >= state.settings.general.failureThreshold) {
              log(`测试失败超阈值(${state.settings.general.failureThreshold}次)，正在移除: ${result.proxy}`);
              rotator.removeProxy(result.proxy);
            } else {
              rotator.updateProxy(result.proxy, {
                status: 'Unavailable',
                consecutiveFailures: newFailures
              });
            }
          }
        }
      },
      log,
      'online',
      state.settings.general.validationThreads,
      state.cancelFlag
    );

    if (!state.cancelFlag.cancelled) finishTask();
  });
});

/**
 * 导出代理
 */
app.get('/api/proxy/export', (req, res) => {
  const format = (req.query.format || 'txt').toLowerCase();
  const allProxies = rotator.getAllProxiesForRevalidation();
  const working = allProxies.filter(p => p.status === 'Working');

  if (working.length === 0) {
    return res.json({ success: false, error: '没有可用的代理可以导出' });
  }

  let content = '';
  let contentType = 'text/plain';

  switch (format) {
    case 'json':
      contentType = 'application/json';
      content = JSON.stringify(working.map(p => ({
        protocol: p.protocol,
        proxy: p.proxy,
        location: p.location
      })), null, 2);
      break;
    
    case 'csv':
      content = 'score,anonymity,protocol,proxy,latency_ms,speed_mbps,location\n';
      content += working.map(p =>
        `${(p.score||0).toFixed(1)},${p.anonymity},${p.protocol},${p.proxy},${((p.latency||0)*1000).toFixed(1)},${(p.speed||0).toFixed(2)},"${p.location||''}"`
      ).join('\n');
      break;
    
    default: // txt
      content = working.map(p => `${p.protocol.toLowerCase()}://${p.proxy}`).join('\n');
  }

  res.json({
    success: true,
    count: working.length,
    format,
    data: content,
    contentType
  });
});

/**
 * 轮换到下一个代理
 */
app.post('/api/proxy/rotate', (req, res) => {
  const { region, qualityLatencyMs } = req.body;
  
  rotator.setFilters(region || 'All', qualityLatencyMs || null);
  const nextProxy = rotator.getNextProxy();

  if (nextProxy) {
    res.json({ success: true, proxy: nextProxy });
  } else {
    res.json({ success: false, error: '无可用代理' });
  }
});

/**
 * 手动选择使用某个代理
 */
app.post('/api/proxy/use', (req, res) => {
  const { proxy } = req.body;
  if (!proxy) return res.json({ success: false, error: '未指定代理地址' });

  const proxyInfo = rotator.setCurrentProxyByAddress(proxy);
  if (proxyInfo) {
    res.json({ success: true, proxyInfo });
  } else {
    res.json({ success: false, error: '代理不可用或不存在' });
  }
});

/**
 * 删除指定代理
 */
app.post('/api/proxy/remove', (req, res) => {
  const { proxy } = req.body;
  if (!proxy) return res.json({ success: false, error: '未指定代理地址' });

  const removed = rotator.removeProxy(proxy);
  res.json({ success: removed });
});

/**
 * 启动本地代理服务
 */
app.post('/api/server/start', (req, res) => {
  if (proxyServer) {
    return res.json({ success: false, error: '服务已在运行中' });
  }

  if (rotator.getActiveProxiesCount() === 0) {
    return res.json({ success: false, error: '代理池中无可用代理' });
  }

  // 如果没有当前代理，先轮换一个
  if (!rotator.getCurrentProxy()) {
    rotator.getNextProxy();
  }

  proxyServer = new ProxyServer(
    '127.0.0.1', HTTP_PROXY_PORT,
    '127.0.0.1', SOCKS5_PROXY_PORT,
    rotator
  );

  // 监听服务日志
  proxyServer.on('log', msg => log(msg));

  proxyServer.startAll();
  
  res.json({ 
    success: true, 
    httpPort: HTTP_PROXY_PORT, 
    socks5Port: SOCKS5_PROXY_PORT 
  });
});

/**
 * 停止本地代理服务
 */
app.post('/api/server/stop', (req, res) => {
  if (!proxyServer) {
    return res.json({ success: false, error: '服务未运行' });
  }

  proxyServer.stopAll();
  proxyServer = null;
  res.json({ success: true });
});

/**
 * 自动轮换控制
 */
app.post('/api/server/auto-rotate', (req, res) => {
  const { enabled, intervalSec } = req.body;

  if (!proxyServer) {
    return res.json({ success: false, error: '代理服务未启动' });
  }

  if (enabled) {
    proxyServer.setRotationMode(intervalSec === 0);
    res.json({ success: true });
  } else {
    proxyServer.setRotationMode(false);
    res.json({ success: true });
  }
});

/**
 * 获取/保存设置
 */
app.get('/api/settings/get', (req, res) => {
  // 尝试从文件加载设置
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const savedSettings = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      Object.assign(state.settings, savedSettings);
    }
  } catch (e) {}

  res.json({ settings: state.settings });
});

app.post('/api/settings/save', (req, res) => {
  const { settings } = req.body;
  if (settings) {
    Object.assign(state.settings, settings);
    
    // 保存到文件
    try {
      fs.writeFileSync(
        path.join(__dirname, 'config.json'), 
        JSON.stringify(state.settings, null, 2), 
        'utf-8'
      );
      log('设置已保存');
    } catch (e) {
      log(`保存设置失败: ${e.message}`, 'error');
    }
  }
  res.json({ success: true });
});

/**
 * 获取当前代理列表（供前端初始加载）
 */
app.get('/api/proxy/list', (req, res) => {
  const proxies = rotator.getAllProxiesForRevalidation();
  res.json({ proxies });
});

// ==================== Server Start ====================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║     🔥 Fir-Proxy Node v1.0         ║');
  console.log('║     高可用 HTTP/SOCKS5 代理池        ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Web 界面: http://localhost:${String(PORT).padEnd(18)}║`);
  console.log(`║  HTTP 代理: 127.0.0.1:${String(HTTP_PROXY_PORT).padEnd(16)}║`);
  console.log(`║  SOCKS5代理: 127.0.0.1:${String(SOCKS5_PROXY_PORT).padEnd(14)}║`);
  console.log('╚══════════════════════════════════════╝');
  console.log('');

  // 初始化检查器（获取本机IP）
  checker.initializePublicIp(log);

  // 创建 temp 目录
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
});
