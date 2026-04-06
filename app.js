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
const crypto = require('crypto');

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
const POOL_FILE = path.join(__dirname, 'pool.json');

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));



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
    },
    auth: {
      enabled: false,
      passwordHash: null,
      passwordSalt: null
    },
    proxyAuth: {
      enabled: false,
      username: 'proxy',
      passwordHash: null,
      passwordSalt: null
    }
  }
};

// ==================== Config ====================
function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const saved = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (saved.general) Object.assign(state.settings.general, saved.general);
      if (saved.auth) Object.assign(state.settings.auth, saved.auth);
      if (saved.proxyAuth) Object.assign(state.settings.proxyAuth, saved.proxyAuth);
    }
  } catch (e) {}
}

function saveConfig() {
  try {
    fs.writeFileSync(
      path.join(__dirname, 'config.json'),
      JSON.stringify(state.settings, null, 2),
      'utf-8'
    );
  } catch (e) {
    log(`保存设置失败: ${e.message}`, 'error');
  }
}

// ==================== Pool Persistence ====================
let _savePoolTimer = null;

function savePool() {
  if (_savePoolTimer) clearTimeout(_savePoolTimer);
  _savePoolTimer = setTimeout(() => {
    try {
      fs.writeFileSync(POOL_FILE, JSON.stringify({
        proxies: rotator.getAllProxiesForRevalidation(),
        excluded: rotator.getExcludedProxies()
      }, null, 2), 'utf-8');
    } catch (e) {
      log(`保存代理池失败: ${e.message}`, 'error');
    }
  }, 2000);
}

function loadPool() {
  try {
    if (fs.existsSync(POOL_FILE)) {
      const data = JSON.parse(fs.readFileSync(POOL_FILE, 'utf-8'));
      if (data.proxies && Array.isArray(data.proxies)) {
        for (const p of data.proxies) rotator.addProxy(p);
      }
      if (data.excluded && Array.isArray(data.excluded)) {
        rotator.addExclusion(data.excluded);
      }
      const cnt = rotator.getActiveProxiesCount();
      if (cnt > 0) {
        log(`已从缓存恢复 ${cnt} 个可用代理`, 'info');
      }
    }
  } catch (e) {
    log(`加载代理池缓存失败: ${e.message}`, 'warn');
  }
}

// ==================== Auth ====================
const sessions = new Map();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_SESSIONS = 10000;

// Simple in-memory rate limiter for auth endpoints
const loginAttempts = new Map();
const RATE_MAX = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS_TRACKED = 10000;
const AUTH_STATE_CLEANUP_MS = 60 * 1000; // 1 minute

function pruneExpiredLoginAttempts(now = Date.now()) {
  for (const [ip, rec] of loginAttempts) {
    if (!rec || typeof rec.resetAt !== 'number' || now > rec.resetAt) {
      loginAttempts.delete(ip);
    }
  }
}

function pruneExpiredSessions(now = Date.now()) {
  for (const [sid, session] of sessions) {
    if (!session || typeof session !== 'object') {
      sessions.delete(sid);
      continue;
    }
    const expiry = typeof session.expiry === 'number' ? session.expiry : null;
    if (expiry !== null && now > expiry) {
      sessions.delete(sid);
    }
  }
}

function enforceMapLimit(map, maxEntries) {
  while (map.size >= maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}

const authStateCleanupTimer = setInterval(() => {
  const now = Date.now();
  pruneExpiredLoginAttempts(now);
  pruneExpiredSessions(now);
}, AUTH_STATE_CLEANUP_MS);
if (typeof authStateCleanupTimer.unref === 'function') {
  authStateCleanupTimer.unref();
}

function rateLimitAuth(req, res, next) {
  const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
  const now = Date.now();
  pruneExpiredLoginAttempts(now);
  let rec = loginAttempts.get(ip);
  if (!rec || now > rec.resetAt) {
    enforceMapLimit(loginAttempts, MAX_LOGIN_ATTEMPTS_TRACKED);
    rec = { count: 0, resetAt: now + RATE_WINDOW_MS };
    loginAttempts.set(ip, rec);
  }
  if (rec.count >= RATE_MAX) {
    return res.status(429).json({ error: `请求过于频繁，${Math.ceil((rec.resetAt - now) / 1000)}秒后重试` });
  }
  rec.count++;
  next();
}

function clearRateLimit(req) {
  const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
  loginAttempts.delete(ip);
}

function randomHex(bytes) {
  return crypto.randomBytes(bytes || 32).toString('hex');
}

// Use scrypt (proper password KDF) for password hashing
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;
  if (!header) return cookies;
  header.split(';').forEach(c => {
    const parts = c.trim().split('=');
    cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
  });
  return cookies;
}

function createSession() {
  enforceMapLimit(sessions, MAX_SESSIONS);
  const token = randomHex(32);
  sessions.set(token, { expiry: Date.now() + SESSION_TTL });
  return token;
}

function buildAuthCookie(req, token, maxAgeSec) {
  const isHttps = req.secure || (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  const secure = isHttps ? '; Secure' : '';
  return `auth_token=${token}; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}; Path=/${secure}`;
}

function validateSession(token) {
  if (!token) return false;
  const s = sessions.get(token);
  if (!s || Date.now() > s.expiry) { sessions.delete(token); return false; }
  return true;
}

function isWebAuthEnabled() {
  return !!(state.settings.auth && state.settings.auth.enabled && state.settings.auth.passwordHash);
}

function isAuthConfigured() {
  return !!(state.settings.auth && state.settings.auth.passwordHash && state.settings.auth.passwordSalt);
}

function isAuthenticated(req) {
  if (!isWebAuthEnabled()) return true;
  return validateSession(parseCookies(req).auth_token);
}

// Auth middleware for all /api routes
app.use('/api', (req, res, next) => {
  const pub = ['/auth/status', '/auth/setup', '/auth/login', '/auth/logout'];
  if (pub.includes(req.path)) return next();
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// 清空日志 API
app.post('/api/logs/clear', (req, res) => {
  if (state.logStreamCallback) {
    state.logStreamCallback({ message: '--- Logs cleared by user ---', level: 'warn' });
  }
  res.json({ success: true });
});

// ==================== Auth Routes ====================

app.get('/api/auth/status', (req, res) => {
  const hasPassword = !!(state.settings.auth && state.settings.auth.passwordHash);
  res.json({ hasPassword, authenticated: !isWebAuthEnabled() || isAuthenticated(req) });
});

app.post('/api/auth/setup', rateLimitAuth, (req, res) => {
  if (state.settings.auth && state.settings.auth.passwordHash) {
    return res.status(400).json({ error: '密码已设置' });
  }
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码至少需要6位' });
  }
  const salt = randomHex(32);
  state.settings.auth = { enabled: true, passwordHash: hashPassword(password, salt), passwordSalt: salt };
  saveConfig();
  clearRateLimit(req);
  const token = createSession();
  res.setHeader('Set-Cookie', buildAuthCookie(req, token, SESSION_TTL / 1000));
  res.json({ success: true });
});

app.post('/api/auth/login', rateLimitAuth, (req, res) => {
  if (!isWebAuthEnabled()) { clearRateLimit(req); return res.json({ success: true }); }
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '请输入密码' });
  const { passwordHash, passwordSalt } = state.settings.auth;
  if (hashPassword(password, passwordSalt) !== passwordHash) {
    return res.status(401).json({ error: '密码错误' });
  }
  clearRateLimit(req);
  const token = createSession();
  res.setHeader('Set-Cookie', buildAuthCookie(req, token, SESSION_TTL / 1000));
  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req);
  if (cookies.auth_token) sessions.delete(cookies.auth_token);
  res.setHeader('Set-Cookie', 'auth_token=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/');
  res.json({ success: true });
});

app.post('/api/auth/change-password', rateLimitAuth, (req, res) => { // rate-limited via rateLimitAuth
  if (!isAuthConfigured()) {
    return res.status(400).json({ error: '请先通过 /api/auth/setup 设置密码' });
  }

  const cookies = parseCookies(req);
  if (!cookies.auth_token || !validateSession(cookies.auth_token)) {
    return res.status(401).json({ error: '未授权' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword) {
    return res.status(400).json({ error: '请输入当前密码' });
  }

  const { passwordHash, passwordSalt } = state.settings.auth;
  if (hashPassword(currentPassword, passwordSalt) !== passwordHash) {
    return res.status(401).json({ error: '当前密码错误' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少需要6位' });
  }
  const salt = randomHex(32);
  state.settings.auth.enabled = true;
  state.settings.auth.passwordHash = hashPassword(newPassword, salt);
  state.settings.auth.passwordSalt = salt;
  sessions.clear();
  saveConfig();
  clearRateLimit(req);
  const token = createSession();
  res.setHeader('Set-Cookie', buildAuthCookie(req, token, SESSION_TTL / 1000));
  res.json({ success: true });
});

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

// Performance constants
const MAX_RESULTS_BUFFER = 5000;   // cap pending validation results in memory
const MAX_POOL_SIZE = 50000;       // hard cap on rotator proxy list
const SSE_LOG_INTERVAL_MS = 50;   // flush batched SSE logs every 50 ms

/**
 * 获取日志流 (SSE) – 日志以 50ms 为批次发送，防止高频验证时刷屏压垮客户端
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

  let logQueue = [];
  let closed = false;

  const flushTimer = setInterval(() => {
    if (closed || logQueue.length === 0) return;
    const batch = logQueue.splice(0);
    try {
      for (const data of batch) res.write(`data: ${data}\n\n`);
    } catch (e) {
      // Client disconnected
    }
  }, SSE_LOG_INTERVAL_MS);

  const onLog = (data) => {
    if (!closed) logQueue.push(data);
  };

  state.logEmitter.on('log', onLog);

  req.on('close', () => {
    closed = true;
    clearInterval(flushTimer);
    logQueue = [];
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

  // Cap in-memory results buffer to prevent OOM when frontend is slow/disconnected
  if (state.resultsBuffer.length < MAX_RESULTS_BUFFER) {
    state.resultsBuffer.push(result);
  }

  // 添加到轮换器（去重），并守卫代理池上限
  if (result.status === 'Working') {
    if (rotator.getAllProxiesForRevalidation().length < MAX_POOL_SIZE) {
      rotator.addProxy(result);
    }
  }
}

function finishTask() {
  state.isRunningTask = false;
  state.taskFinished = true;
  
  const workingCount = rotator.getActiveProxiesCount();
  const totalInRotator = rotator.getAllProxiesForRevalidation().length;
  log(`\n${'='.repeat(20)} 任务全部完成 ${'='.repeat(20)}`);
  log(`代理池现有 ${workingCount} 个可用的代理。`, workingCount > 0 ? 'success' : 'warn');
  savePool();
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
  
  log('所有代理已清空');
  savePool();
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
  const working = allProxies.filter(p => p.status === 'Working' && !rotator.isExcluded(p.proxy));

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
 * 获取排除列表
 */
app.get('/api/proxy/exclusions', (req, res) => {
  res.json({ excluded: rotator.getExcludedProxies() });
});

/**
 * 添加代理到排除列表（支持多选）
 */
app.post('/api/proxy/exclusions/add', (req, res) => {
  const { proxies } = req.body;
  if (!proxies || !Array.isArray(proxies) || proxies.length === 0) {
    return res.json({ success: false, error: '未指定代理地址' });
  }
  rotator.addExclusion(proxies);
  log(`已将 ${proxies.length} 个代理加入排除列表`);
  savePool();
  res.json({ success: true, count: proxies.length });
});

/**
 * 从排除列表移除代理（支持多选）
 */
app.post('/api/proxy/exclusions/remove', (req, res) => {
  const { proxies } = req.body;
  if (!proxies || !Array.isArray(proxies) || proxies.length === 0) {
    return res.json({ success: false, error: '未指定代理地址' });
  }
  rotator.removeExclusion(proxies);
  log(`已将 ${proxies.length} 个代理从排除列表移除`);
  savePool();
  res.json({ success: true });
});

/**
 * 清空排除列表
 */
app.post('/api/proxy/exclusions/clear', (req, res) => {
  rotator.clearExclusions();
  log('排除列表已清空');
  savePool();
  res.json({ success: true });
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
  if (removed) savePool();
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

  const ac = state.settings.proxyAuth;
  const authConfig = (ac && ac.enabled && ac.passwordHash)
    ? { enabled: true, username: ac.username || 'proxy', passwordHash: ac.passwordHash, passwordSalt: ac.passwordSalt }
    : { enabled: false };

  proxyServer = new ProxyServer(
    '127.0.0.1', HTTP_PROXY_PORT,
    '127.0.0.1', SOCKS5_PROXY_PORT,
    rotator,
    authConfig
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
 * 本地代理连通性测试：通过本地 SOCKS5 代理请求指定 URL
 */
// 允许的测试 URL 白名单（同时允许通过 SSRF 检查的任意 URL）
const SSRF_PRIVATE_RE = /^(localhost$|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0$|::1$|fc[0-9a-f]{2}:|fe[89ab][0-9a-f]:)/i;

app.get('/api/server/test', async (req, res) => {
  if (!proxyServer) {
    return res.json({ success: false, error: '代理服务未启动' });
  }

  const rawUrl = (req.query.url || 'https://api.ipify.org?format=json').trim();

  // 校验 URL 安全性：只允许 http/https，禁止内网/保留地址（防 SSRF）
  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.json({ success: false, error: '仅支持 http/https 协议' });
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    if (SSRF_PRIVATE_RE.test(hostname)) {
      return res.json({ success: false, error: '不允许测试内网或保留地址' });
    }
  } catch (e) {
    return res.json({ success: false, error: '无效的测试 URL' });
  }

  const currentProxy = rotator.getCurrentProxy() || rotator.getNextProxy();
  if (!currentProxy) {
    return res.json({ success: false, error: '代理池中无可用代理' });
  }

  try {
    const { SocksProxyAgent } = require('socks-proxy-agent');
    const axios = require('axios');

    const agent = new SocksProxyAgent(`socks5://127.0.0.1:${SOCKS5_PROXY_PORT}`);
    const startTime = Date.now();
    // testUrl is a validated, non-private HTTP/HTTPS URL
    const testUrl = parsedUrl.toString();
    const response = await axios.get(testUrl, {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 15000,
      validateStatus: () => true,
      responseType: 'text',
      maxRedirects: 5
    });
    const latencyMs = Date.now() - startTime;
    const statusCode = response.status;
    const ok = statusCode >= 200 && statusCode < 300;

    // 尝试提取出口 IP（仅当响应为 JSON 且含 ip 字段时，如 ipify）
    let exitIp = null;
    try {
      const parsed = JSON.parse(response.data);
      if (parsed && typeof parsed.ip === 'string' && /^[\d.a-fA-F:]+$/.test(parsed.ip)) {
        exitIp = parsed.ip;
      }
    } catch (_) {}

    const result = {
      success: ok,
      statusCode,
      latencyMs,
      exitIp,
      upstreamProxy: currentProxy.proxy,
      upstreamProtocol: currentProxy.protocol
    };

    log(`[测试] ${testUrl} → HTTP ${statusCode} (${latencyMs}ms) via ${currentProxy.protocol}://${currentProxy.proxy}`, ok ? 'success' : 'warn');
    res.json(result);
  } catch (e) {
    log(`[测试] ${testUrl} 失败: ${e.message}`, 'error');
    res.json({ success: false, error: e.message });
  }
});

/**
 * 重启本地代理服务
 */
app.post('/api/server/restart', (req, res) => {
  if (proxyServer) {
    proxyServer.stopAll();
    proxyServer = null;
  }

  if (rotator.getActiveProxiesCount() === 0) {
    return res.json({ success: false, error: '代理池中无可用代理' });
  }

  if (!rotator.getCurrentProxy()) {
    rotator.getNextProxy();
  }

  const ac = state.settings.proxyAuth;
  const authConfig = (ac && ac.enabled && ac.passwordHash)
    ? { enabled: true, username: ac.username || 'proxy', passwordHash: ac.passwordHash, passwordSalt: ac.passwordSalt }
    : { enabled: false };

  proxyServer = new ProxyServer(
    '127.0.0.1', HTTP_PROXY_PORT,
    '127.0.0.1', SOCKS5_PROXY_PORT,
    rotator,
    authConfig
  );
  proxyServer.on('log', msg => log(msg));
  proxyServer.startAll();

  log('代理服务已重启', 'info');
  res.json({ success: true, httpPort: HTTP_PROXY_PORT, socks5Port: SOCKS5_PROXY_PORT });
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
      const saved = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (saved.general) Object.assign(state.settings.general, saved.general);
      if (saved.auth) Object.assign(state.settings.auth, saved.auth);
      if (saved.proxyAuth) Object.assign(state.settings.proxyAuth, saved.proxyAuth);
    }
  } catch (e) {}

  // 返回时不包含敏感哈希数据
  res.json({
    settings: {
      general: state.settings.general,
      auth: {
        enabled: state.settings.auth.enabled,
        hasPassword: !!state.settings.auth.passwordHash
      },
      proxyAuth: {
        enabled: state.settings.proxyAuth.enabled,
        username: state.settings.proxyAuth.username || ''
      }
    }
  });
});

app.post('/api/settings/save', (req, res) => {
  const { settings } = req.body;
  if (settings) {
    if (settings.general) Object.assign(state.settings.general, settings.general);

    if (settings.proxyAuth) {
      // Hash proxy password if provided
      if (settings.proxyAuth.password) {
        const salt = randomHex(32);
        settings.proxyAuth.passwordHash = hashPassword(settings.proxyAuth.password, salt);
        settings.proxyAuth.passwordSalt = salt;
      }
      const { password, ...safeProxyAuth } = settings.proxyAuth;
      Object.assign(state.settings.proxyAuth, safeProxyAuth);
    }

    // Restart proxy server if running with updated auth config
    if (proxyServer && settings.proxyAuth) {
      const ac = state.settings.proxyAuth;
      proxyServer.updateAuth(ac.enabled && ac.passwordHash
        ? { enabled: true, username: ac.username || 'proxy', passwordHash: ac.passwordHash, passwordSalt: ac.passwordSalt }
        : { enabled: false });
    }

    saveConfig();
    log('设置已保存');
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

/**
 * 获取应用运行状态（供前端刷新后恢复）
 */
app.get('/api/status', (req, res) => {
  res.json({
    isRunningTask: state.isRunningTask,
    progress: state.progress,
    taskFinished: state.taskFinished,
    proxyCount: rotator.getActiveProxiesCount(),
    serverRunning: !!proxyServer
  });
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

  // 加载配置
  loadConfig();

  // 恢复代理池缓存
  loadPool();

  // 创建 temp 目录
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
});
