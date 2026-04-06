// ==================== ProxyPulse Frontend ====================

// ===== I18N - 完整双语字典 =====
const T = {
  zh: {
    t: 'ProxyPulse',
    off: '未启动', on: '运行中',
    fch: '获取代理', imp: '导入', can: '取消任务', clr: '清空列表',
    ret: '全部重测', exp: '导出代理', ar: '全部国家',
    el: '仅优质', la: '延迟 <', rot: '轮换IP', auto: '自动',
    ssrv: '启动服务', esrv: '停止服务',
    pl: '可用代理列表', ll: '实时日志',
    emp: "暂无代理数据\n点击「获取代理」开始采集",
    clog: '清空日志', sbot: '滚到底部', cu: '使用此代理', del: '删除此代理',
    cpy: '复制地址', hg: '使用说明',
    tcop: '已复制: ', tdel: '已删除: ', tclr: '已清空所有代理',
    texp: '已导出 ',
    lrdy: '系统就绪，等待操作...',
    ltip: '提示: 点击「获取代理」一键采集验证免费代理',
    lsrvc: '代理服务已启动 (SOCKS5://127.0.0.1:1800, HTTP://127.0.0.1:1801)',
    lsrvs: '代理服务已停止',
    lrot: '已轮换到: ',
    cclr: '确定要清空日志吗？',
    cclear: '确定要清空所有代理吗？',
    // 表头
    th_score: '评分', th_anon: '匿名度', th_proto: '协议',
    th_addr: '地址', th_lat: '延迟(ms)', th_spd: '速度(KB/s)', th_loc: '地区',
    // 匿名度
    anon_elite: '高匿', anon_anonymous: '匿名', anon_transparent: '透明',
    // 状态
    st_working: '可用', st_failed: '失败',
    // 进度条
    prog_preparing: '准备中...',
    prog_progress: '进度:',
    prog_working: '✨ 可用数: ',
    // 日志
    log_start: '==================== 开始获取在线免费代理 ====================',
    log_success: '✅ 成功: ',
    log_sep: '| 评分: ',
    log_lat: '| 延迟: ',
    log_ms: 'ms',
    log_complete: '✅ 任务完成',
    log_avail: '个可用的代理。',
    log_importing: '正在导入: ',
    log_cleared: '所有代理已清除。',
    log_reval: '==================== 正在重新验证所有代理 ====================',
    log_cancelled: '任务已取消。',
    log_timeout: '轮询等待超时，停止等待。',
    log_auto_on: '自动轮换 已开启: ',
    log_auto_per: '逐请求模式',
    log_auto_sec: '秒/次',
    log_auto_off: '自动轮换 已停止。',
    log_loaded: 'ProxyPulse 加载成功 ✅',
    // 右键菜单
    ctx_use: '使用此代理', ctx_del: '删除', ctx_copy: '复制地址',
    ctx_excl: '排除此代理', ctx_unexcl: '取消排除',
    // 弹窗
    done_fmt: '完成！可用: ',
    done_total: ' / 总计: ',
    fmt_choose: '选择导出格式 (txt/csv/json):',
    fmt_txt: 'txt',
    // 排除功能
    excl_sel: '排除选中', excl_clr: '清除排除',
    no_sel: '请先勾选代理',
    texcl: '已排除 ', tunexcl: '已取消排除 ',
    excl_cnt: '个已排除',
    excl_cleared: '排除列表已清空',
    cclear_excl: '确定要清空排除列表吗？',
    // 其他
    no_proxy: '无可用代理',
    empty_pool: '代理池为空',
    wait_task: '请等待当前任务完成',
    invalid_interval: '无效间隔',
    stop_auto: '停止自动',
    service_started: '服务已启动！',
    start_failed: '启动失败',
    import_fail: '导入失败',
    ms: 'ms', sec_hint: 's',
    port_info: 'SOCKS5:1800 / HTTP:1801',
    // Auth
    auth_setup_title: '设置访问密码', auth_setup_sub: '首次使用，请设置一个登录密码来保护您的控制面板。',
    auth_login_title: '登录', auth_login_sub: '请输入密码以访问 ProxyPulse 控制面板。',
    auth_pw_label: '密码', auth_confirm_label: '确认密码', auth_btn_setup: '设置密码',
    auth_btn_login: '登录', auth_err_short: '密码至少需要6位', auth_err_mismatch: '两次密码不一致',
    auth_err_wrong: '密码错误', auth_logout: '退出登录',
    // Settings
    settings_title: '设置', settings_general: '通用设置', settings_auth: 'Web 面板认证',
    settings_proxy_auth: '本地代理认证', settings_threads: '验证线程数', settings_fail_thr: '失败阈值（次）',
    settings_auth_enable: '启用密码保护', settings_cur_pw: '当前密码', settings_new_pw: '新密码（留空不改）',
    settings_cfm_pw: '确认新密码', settings_proxy_auth_enable: '启用代理认证', settings_proxy_user: '用户名',
    settings_proxy_pw: '密码（留空不改）', settings_cancel: '取消', settings_save: '保存',
    settings_saved: '设置已保存', settings_pw_changed: '密码已更新，请重新登录',
    settings_err_cur_pw: '当前密码错误', settings_err_short: '密码至少需要6位',
    settings_err_mismatch: '两次密码不一致',
    // Pool restore
    pool_restored: '已恢复代理池：',
    pool_task_resumed: '任务运行中，正在继续监听...',
    // 自检
    test_btn: '自检', test_running: '检测中...', test_ok: '自检通过 出口IP: ', test_fail: '自检失败: ',
    test_tip: '测试本地代理连通性',
    // 代理测试弹窗
    test_modal_title: '代理连通性测试',
    test_url_label: '测试 URL',
    test_url_custom: '自定义...',
    test_url_custom_placeholder: 'https://...',
    test_run: '开始测试', test_cancel: '关闭',
    test_res_ok: '✅ 连通 | HTTP ', test_res_fail: '❌ 失败: ',
    test_res_lat: ' | 延迟: ', test_res_ip: ' | 出口IP: ',
    test_res_via: ' | 上游: ',
    // 重启服务
    restart_btn: '重启', restart_ok: '代理服务已重启', restart_fail: '重启失败: ',
  },
  en: {
    t: 'ProxyPulse',
    off: 'Offline', on: 'Running',
    fch: 'Fetch Proxies', imp: 'Import', can: 'Cancel Task', clr: 'Clear All',
    ret: 'Re-test All', exp: 'Export', ar: 'All Regions',
    el: 'Elite Only', la: 'Latency <', rot: 'Rotate IP', auto: 'Auto',
    ssrv: 'Start Service', esrv: 'Stop Service',
    pl: 'Proxy List', ll: 'Live Logs',
    emp: "No proxies yet.\nClick 'Fetch Proxies' to start.",
    clog: 'Clear Logs', sbot: 'Scroll Bottom', cu: 'Use This Proxy', del: 'Delete',
    cpy: 'Copy Address', hg: 'User Guide',
    tcop: 'Copied: ', tdel: 'Deleted: ', tclr: 'All proxies cleared.',
    texp: 'Exported ',
    lrdy: 'System ready.',
    ltip: "Hint: Click 'Fetch Proxies' to scrape & verify free proxies.",
    lsrvc: 'Proxy service started (SOCKS5://127.0.0.1:1800, HTTP://127.0.0.1:1801)',
    lsrvs: 'Proxy service stopped.',
    lrot: 'Rotated to: ',
    cclr: 'Clear all logs?',
    cclear: 'Are you sure you want to clear all proxies?',
    // 表头
    th_score: 'Score', th_anon: 'Anonymity', th_proto: 'Protocol',
    th_addr: 'Address', th_lat: 'Latency (ms)', th_spd: 'Speed (KB/s)', th_loc: 'Location',
    // 匿名度
    anon_elite: 'Elite', anon_anonymous: 'Anonymous', anon_transparent: 'Transparent',
    // 状态
    st_working: 'Working', st_failed: 'Failed',
    // 进度条
    prog_preparing: 'Preparing...',
    prog_progress: 'Progress: ',
    prog_working: '✨ Working: ',
    // 日志
    log_start: '==================== Fetching Free Proxies ====================',
    log_success: '✅ Success: ',
    log_sep: '| Score: ',
    log_lat: '| Latency: ',
    log_ms: 'ms',
    log_complete: '✅ Complete',
    log_avail: ' working proxies.',
    log_importing: 'Importing: ',
    log_cleared: 'All proxies cleared.',
    log_reval: '==================== Re-validating All Proxies ====================',
    log_cancelled: 'Task cancelled.',
    log_timeout: 'Polling timeout, stopped waiting.',
    log_auto_on: 'Auto-rotate ON: ',
    log_auto_per: 'per-request mode',
    log_auto_sec: 's interval',
    log_auto_off: 'Auto-rotate stopped.',
    log_loaded: 'ProxyPulse loaded successfully ✅',
    // 右键菜单
    ctx_use: 'Use Proxy', ctx_del: 'Delete', ctx_copy: 'Copy Address',
    ctx_excl: 'Exclude Proxy', ctx_unexcl: 'Remove Exclusion',
    // 弹窗
    done_fmt: 'Done! Working: ',
    done_total: ' / Total: ',
    fmt_choose: 'Choose format (txt/csv/json):',
    fmt_txt: 'txt',
    // 排除功能
    excl_sel: 'Exclude Selected', excl_clr: 'Clear Exclusions',
    no_sel: 'Please select proxies first',
    texcl: 'Excluded ', tunexcl: 'Unexcluded ',
    excl_cnt: ' excluded',
    excl_cleared: 'Exclusion list cleared',
    cclear_excl: 'Clear all exclusions?',
    // 其他
    no_proxy: 'No available proxy',
    empty_pool: 'Empty pool',
    wait_task: 'Wait for task to finish',
    invalid_interval: 'Invalid interval',
    stop_auto: 'Stop Auto',
    service_started: 'Service started!',
    start_failed: 'Start failed',
    import_fail: 'Import failed',
    ms: 'ms', sec_hint: 's',
    port_info: 'SOCKS5:1800 / HTTP:1801',
    // Auth
    auth_setup_title: 'Set Dashboard Password', auth_setup_sub: 'First run: set a password to protect your dashboard.',
    auth_login_title: 'Login', auth_login_sub: 'Enter your password to access ProxyPulse.',
    auth_pw_label: 'Password', auth_confirm_label: 'Confirm Password', auth_btn_setup: 'Set Password',
    auth_btn_login: 'Login', auth_err_short: 'Password must be at least 6 characters', auth_err_mismatch: 'Passwords do not match',
    auth_err_wrong: 'Incorrect password', auth_logout: 'Logout',
    // Settings
    settings_title: 'Settings', settings_general: 'General', settings_auth: 'Dashboard Auth',
    settings_proxy_auth: 'Local Proxy Auth', settings_threads: 'Validation Threads', settings_fail_thr: 'Failure Threshold',
    settings_auth_enable: 'Enable Password Protection', settings_cur_pw: 'Current Password', settings_new_pw: 'New Password (blank = no change)',
    settings_cfm_pw: 'Confirm New Password', settings_proxy_auth_enable: 'Enable Proxy Auth', settings_proxy_user: 'Username',
    settings_proxy_pw: 'Password (blank = no change)', settings_cancel: 'Cancel', settings_save: 'Save',
    settings_saved: 'Settings saved', settings_pw_changed: 'Password updated, please login again',
    settings_err_cur_pw: 'Current password is incorrect', settings_err_short: 'Password must be at least 6 characters',
    settings_err_mismatch: 'Passwords do not match',
    // Pool restore
    pool_restored: 'Proxy pool restored: ',
    pool_task_resumed: 'Task is running, resuming listener...',
    // Self-test
    test_btn: 'Test', test_running: 'Testing...', test_ok: 'Test passed. Exit IP: ', test_fail: 'Test failed: ',
    test_tip: 'Test local proxy connectivity',
    // Test modal
    test_modal_title: 'Proxy Connectivity Test',
    test_url_label: 'Test URL',
    test_url_custom: 'Custom...',
    test_url_custom_placeholder: 'https://...',
    test_run: 'Run Test', test_cancel: 'Close',
    test_res_ok: '✅ OK | HTTP ', test_res_fail: '❌ Failed: ',
    test_res_lat: ' | Latency: ', test_res_ip: ' | Exit IP: ',
    test_res_via: ' | Via: ',
    // Restart
    restart_btn: 'Restart', restart_ok: 'Proxy service restarted', restart_fail: 'Restart failed: ',
  }
};

let lang = localStorage.getItem('pp_lang') || 'zh';
let theme = localStorage.getItem('pp_theme') || 'dark';

function tr(key) { return (T[lang] && T[lang][key]) || key; }

// 安全获取DOM元素（防止null错误）
function $(id) { return document.getElementById(id); }

// 应用所有翻译
function applyT() {
  var d = T[lang];
  // Header
  setTxt('lblTitle', d.t);
  setTxt('svTxt', S.server ? d.on : d.off);
  // 工具栏按钮
  setTxt('lbFetch', d.fch); setTxt('lbImport', d.imp);
  setTxt('lbCancel', d.can); setTxt('lbClear', d.clr);
  setTxt('lbRetest', d.ret); setTxt('lbExport', d.exp);
  setTxt('lbExclSel', d.excl_sel); setTxt('lbExclClr', d.excl_clr);
  setTxt('lbStartSrv', d.ssrv);
  setTxt('lbRestart', d.restart_btn);
  setTxt('lbTest', d.test_btn);
  // 代理测试弹窗
  setTxt('lblTestTitle', d.test_modal_title);
  setTxt('lblTestUrl', d.test_url_label);
  setTxt('lbTestRun', d.test_run);
  setTxt('lbTestClose', d.test_cancel);
  var optC = $('optCustom'); if(optC) optC.textContent = d.test_url_custom;
  var ci = $('testUrlCustom'); if(ci) ci.placeholder = d.test_url_custom_placeholder;
  // 过滤区
  setTxt('lblEliteOnly', d.el);
  setTxt('lblLatencyHint', d.la);
  setTxt('lblMs', d.ms);
  setTxt('lbRotate', d.rot);
  setTxt('lbAuto', d.auto);
  setTxt('lblSec', d.sec_hint);
  setTxt('lblPortInfo', d.port_info);
  // 面板标题
  setTxt('lblProxyList', d.pl);
  setTxt('lblLiveLogs', d.ll);
  setTxt('lbClearLog', d.clog);
  setTxt('lbScrollBot', d.sbot);
  setTxt('lblHelpTitle', d.hg);
  // 进度条默认文字
  if (!$('progBar').style.width || $('progBar').style.width === '0%') {
    setTxt('progTxt', d.prog_preparing);
  }
  // 表头
  var thMap = { score: d.th_score, anonymity: d.th_anon, protocol: d.th_proto,
                addr: d.th_addr, latency: d.th_lat, speed: d.th_spd, location: d.th_loc };
  document.querySelectorAll('.th-label').forEach(function(el) {
    var col = el.parentElement.dataset.sort;
    if (col && thMap[col]) el.textContent = thMap[col];
  });
  // 空状态
  var emp = $('emptySt');
  if (emp && emp.style.display !== 'none') {
    var et = emp.querySelector('.etext');
    if (et) et.innerHTML = d.emp.replace('\n', '<br/>');
  }
  // 右键菜单
  var ctxItems = $('ctxMenu') ? $('ctxMenu').querySelectorAll('.ci span') : [];
  if (ctxItems.length >= 3) { ctxItems[0].textContent = d.ctx_use; ctxItems[1].textContent = d.ctx_del; ctxItems[2].textContent = d.ctx_copy; }
  // 排除上下文菜单标签（动态，showCtx时更新）
  // Help Modal
  renderHelp();
  // Settings Modal
  applySettingsT();
}

// 安全设置文本
function setTxt(id, text) {
  var el = $(id); if (el) el.textContent = text;
}

function toggleLang() {
  lang = lang === 'zh' ? 'en' : 'zh';
  var lbl = $('langLbl'); if (lbl) lbl.textContent = lang.toUpperCase();
  localStorage.setItem('pp_lang', lang);
  applyT();
  refreshTable();
}
function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  var ti = $('thIcon');
  if (ti) ti.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
  lucide.createIcons({ attrs: { strokeWidth: 1.5 } });
  localStorage.setItem('pp_theme', theme);
}

// State
var S = { proxies: [], dSet: new Set(), running: false, server: false, autoRot: false, autoTimer: null, selAddr: null, scol: 'score', desc: true, cancel: { cancelled: false }, settings: {}, excludedSet: new Set(), selectedSet: new Set(), page: 0, pageSize: 100, cachedWorking: 0 };

// API
async function api(p, m, b) {
  if (!m) m = 'GET';
  try {
    var o = { method: m, headers: { 'Content-Type': 'application/json' } };
    if (b) o.body = JSON.stringify(b);
    var resp = await fetch('/api' + p, o);
    if (resp.status === 401) { checkAuth(); return null; }
    if (!resp.ok && resp.status >= 400) { try { return await resp.json(); } catch(e) { return null; } }
    return await resp.json();
  } catch (e) { log('API Error: ' + e.message, 'er'); return null; }
 }

// Log – batched DOM updates every 200 ms to avoid layout thrashing
var _logBuffer = [];
var _logFlushTimer = null;
var MAX_LOG_ENTRIES = 500;

function _flushLogs() {
  _logFlushTimer = null;
  if (!_logBuffer.length) return;
  var c = $('logBody');
  if (!c) { _logBuffer = []; return; }
  var atBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 60;
  var frag = document.createDocumentFragment();
  var t = new Date();
  var entries = _logBuffer.splice(0);
  for (var i = 0; i < entries.length; i++) {
    var item = entries[i];
    var e = document.createElement('div');
    e.className = 'le';
    var cls = item.lvl === 'error' ? 'er' : item.lvl === 'success' ? 'ok' : item.lvl === 'warn' ? 'wa' : item.lvl === 'info' ? 'in' : 'n';
    e.innerHTML = '<span class="lt">' + item.ts + '</span><span class="l' + cls + '">' + esc(item.msg) + '</span>';
    frag.appendChild(e);
  }
  c.appendChild(frag);
  // Trim oldest entries to cap DOM size
  while (c.children.length > MAX_LOG_ENTRIES) c.removeChild(c.firstChild);
  // Only auto-scroll if user was already at the bottom
  if (atBottom) c.scrollTop = c.scrollHeight;
}

function log(msg, lvl) {
  if (!lvl) lvl = 'normal';
  var t = new Date().toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour12: false });
  _logBuffer.push({ msg: msg, lvl: lvl, ts: t });
  if (!_logFlushTimer) _logFlushTimer = setTimeout(_flushLogs, 200);
}
function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function clearLogs() { if (!confirm(tr('cclr'))) return; var c = $('logBody'); if (c) c.innerHTML = ''; showToast(tr('clog') + ' OK', 'in'); }
function scrollLogBot() { var c = $('logBody'); if (c) c.scrollTop = 999999; }

// Toast
function showToast(msg, type) {
  if (!type) type = 'in';
  var tc = $('toastCont');
  if (!tc) return;
  var t = document.createElement('div');
  var ic = type === 'ok' ? 'check-circle' : type === 'er' ? 'alert-circle' : type === 'wa' ? 'alert-triangle' : 'info';
  t.className = 'toast toast-' + type;
  t.innerHTML = '<i data-lucide="' + ic + '"></i>' + msg;
  tc.appendChild(t);
  lucide.createIcons({ root: t, attrs: { strokeWidth: 1.5, size: 16 } });
  setTimeout(function () { t.classList.add('rm'); setTimeout(function () { t.remove(); }, 300); }, 3200);
}

// Buttons
function setBtn(en) {
  ['btnFetch','btnImport'].forEach(function(id) { var el = $(id); if (el) el.disabled = !en; });
  var bc = $('btnCancel'); if (bc) bc.disabled = !en;
}
function updBtns() {
  var wc = S.cachedWorking;
  var ha = S.proxies.length > 0;
  ['btnRetest','btnExport','btnServer','btnRotate','btnAutoRotate'].forEach(function(id) {
    var el = $(id); if (el) el.disabled = S.running || !ha;
  });
  var bxs = $('btnExclSel');
  if (bxs) bxs.disabled = S.selectedSet.size === 0;
  var sb = $('btnServer'), si = $('bsIcon');
  if (sb) {
    if (S.server) {
      sb.className = 'btn btn-dan';
      if (si) si.setAttribute('data-lucide', 'square');
      setTxt('lbStartSrv', tr('esrv'));
    } else {
      sb.className = 'btn btn-ok';
      if (si) si.setAttribute('data-lucide', 'play');
      setTxt('lbStartSrv', tr('ssrv'));
    }
    lucide.createIcons({ root: sb, attrs: { strokeWidth: 1.5 } });
  }
  var ab = $('btnAutoRotate');
  if (ab) {
    ab.className = S.autoRot ? 'btn btn-dan' : 'btn btn-gho';
    var sp = ab.querySelector('span');
    if (sp) sp.textContent = S.autoRot ? tr('stop_auto') : tr('auto');
  }
  var tb = $('btnTest');
  if (tb) tb.disabled = !S.server;
  var rb = $('btnRestart');
  if (rb) rb.disabled = !S.server;
  var ci = $('pcItem'), ct = $('pcTxt');
  if (ci) ci.style.display = ha ? 'flex' : 'none';
  if (ct) ct.textContent = ha ? wc + '/' + S.proxies.length : '';
  var ts = $('tblStats'); if (ts) ts.textContent = ha ? wc + '/' + S.proxies.length : '';
}

// Progress - 国际化
function showProg(max) {
  var pc = $('progC');
  if (pc) { pc.style.display = 'block'; pc.classList.add('show'); }
  var pb = $('progBar'); if (pb) pb.style.width = '0%';
  setTxt('progTxt', tr('prog_preparing'));
  setTxt('progCnt', '');
}
function updProg(c, max) {
  var pct = max ? Math.round(c / max * 100) : 0;
  var pb = $('progBar'); if (pb) pb.style.width = pct + '%';
  setTxt('progTxt', tr('prog_progress') + c + '/' + (max || '?'));
  setTxt('progCnt', tr('prog_working') + S.cachedWorking);
}
function hideProg() {
  var pc = $('progC');
  if (pc) { pc.classList.remove('show'); setTimeout(function() { pc.style.display = 'none'; }, 300); }
}

// 匿名度翻译
function trAnon(a) {
  if (!a) return '-';
  var map = { Elite: tr('anon_elite'), Anonymous: tr('anon_anonymous'), Transparent: tr('anon_transparent') };
  return map[a] || a;
}

// Table – paginated rendering (S.pageSize rows/page) with DocumentFragment batching
var _refreshDebounceTimer = null;

function refreshTable() {
  // Debounce: skip redundant calls within 150 ms
  if (_refreshDebounceTimer) return;
  _refreshDebounceTimer = setTimeout(function() {
    _refreshDebounceTimer = null;
    _doRefreshTable();
  }, 150);
}

function _getFilteredSorted() {
  var rf = $('regionFilter'),
      rv = rf ? rf.value : '',
      qc = $('qualityCheck'),
      uq = qc ? qc.checked : false,
      qlEl = $('qualityLatency'),
      ql = qlEl ? (parseInt(qlEl.value) || 2000) : 2000;
  var fl = S.proxies.filter(function(p) {
    if (rv && p.location !== rv.replace(/\s*\(\d+\)$/, '') && p.location !== rv) return false;
    if (p.status === 'Working' && uq && (p.latency || Infinity) * 1000 > ql) return false;
    return true;
  });
  fl.sort(function(a, b) {
    var v = a[S.scol], vb = b[S.scol];
    if (S.scol === 'latency') { v = v === Infinity ? 99999 : v; vb = vb === Infinity ? 99999 : vb; }
    else if (['speed','score'].indexOf(S.scol) >= 0) { v = v || 0; vb = vb || 0; }
    return typeof v === 'string' ? (S.desc ? vb.localeCompare(v) : v.localeCompare(vb)) : (S.desc ? vb - v : v - vb);
  });
  return fl;
}

function _doRefreshTable() {
  var tb = $('tblBody'), emp = $('emptySt');
  var fl = _getFilteredSorted();

  var totalPages = Math.max(1, Math.ceil(fl.length / S.pageSize));
  if (S.page >= totalPages) S.page = totalPages - 1;
  var start = S.page * S.pageSize;
  var pageSlice = fl.slice(start, start + S.pageSize);

  if (tb) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < pageSlice.length; i++) {
      frag.appendChild(_makeRow(pageSlice[i]));
    }
    tb.innerHTML = '';
    tb.appendChild(frag);
  }

  if (!fl.length) {
    if (emp) { emp.style.display = 'flex'; var et = emp.querySelector('.etext'); if (et) et.innerHTML = tr('emp').replace('\n', '<br/>'); }
  } else {
    if (emp) emp.style.display = 'none';
  }

  _updatePagination(fl.length, totalPages);

  // 更新全选框状态
  var chkAll = $('chkAll');
  if (chkAll) {
    var visAddrs = pageSlice.map(function(p){return p.proxy;});
    var allSel = visAddrs.length > 0 && visAddrs.every(function(a){return S.selectedSet.has(a);});
    chkAll.checked = allSel;
    chkAll.indeterminate = !allSel && visAddrs.some(function(a){return S.selectedSet.has(a);});
  }
  updExclBadge();
  upRegion();
  updBtns();
}

function _makeRow(p) {
  var row = document.createElement('tr');
  var isExcl = S.excludedSet.has(p.proxy);
  var isSel = S.selectedSet.has(p.proxy);
  var cls = [];
  if (p.status !== 'Working') cls.push('unavail');
  if (isExcl) cls.push('excluded');
  if (isSel) cls.push('row-sel');
  row.className = cls.join(' ');
  var sc = p.score != null ? p.score.toFixed(1) : 'N/A';
  var lt = p.status === 'Working' && p.latency != null ? (p.latency * 1000).toFixed(1) : '-';
  var sp = p.status === 'Working' ? (p.speed || 0).toFixed(2) : '-';
  var pc = p.protocol === 'HTTP' ? 'tag-http' : p.protocol === 'SOCKS5' ? 'tag-s5' : 'tag-s4';
  var ac = p.anonymity === 'Elite' ? 'tag-el' : p.anonymity === 'Anonymous' ? 'tag-an' : 'tag-tr';
  row.innerHTML =
    '<td class="chk-cell"><input type="checkbox" ' + (isSel ? 'checked' : '') + '></td>' +
    '<td style="font-weight:700;color:' + (p.status === 'Working' ? 'var(--accent)' : 'var(--t3)') + '">' + sc + '</td>' +
    '<td><span class="' + ac + '">' + trAnon(p.anonymity) + '</span></td>' +
    '<td><span class="' + pc + '">' + esc(p.protocol || '-') + '</span></td>' +
    '<td style="font-family:\'JetBrains Mono\',monospace;font-weight:600;color:' + (p.status === 'Working' ? 'var(--ok)' : '') + '">' + esc(p.proxy) + '</td>' +
    '<td>' + lt + '</td><td>' + sp + '</td>' +
    '<td>' + esc(p.location || '-') + '</td>';
  row.dataset.addr = p.proxy;
  var cb = row.querySelector('input[type=checkbox]');
  if (cb) { (function(addr){ cb.onclick = function(e){ toggleRowSel(e, addr); }; })(p.proxy); }
  row.ondblclick = function() { copySingle(p.proxy); };
  row.oncontextmenu = function(e) { showCtx(e, p.proxy); };
  return row;
}

function _updatePagination(total, totalPages) {
  var pc = $('pgCont');
  if (!pc) return;
  if (totalPages <= 1) { pc.style.display = 'none'; return; }
  pc.style.display = 'flex';
  var info = $('pgInfo'), prev = $('pgPrev'), next = $('pgNext');
  if (info) info.textContent = (S.page + 1) + ' / ' + totalPages + '  (' + total + ')';
  if (prev) prev.disabled = S.page === 0;
  if (next) next.disabled = S.page >= totalPages - 1;
}

function pgPrev() { if (S.page > 0) { S.page--; _doRefreshTable(); } }
function pgNext() {
  var fl = _getFilteredSorted();
  var totalPages = Math.max(1, Math.ceil(fl.length / S.pageSize));
  if (S.page < totalPages - 1) { S.page++; _doRefreshTable(); }
}

// 地区下拉
function upRegion() {
  var s = $('regionFilter');
  if (!s) return;
  var cv = s.value, c = {};
  S.proxies.filter(function(p) { return p.status === 'Working'; }).forEach(function(p) { c[p.location] = (c[p.location] || 0) + 1; });
  var o = ['<option value="">' + tr('ar') + '</option>'];
  Object.entries(c).sort(function(a,b){return b[1]-a[1];}).forEach(function(kv){
    o.push('<option value="' + kv[0] + '">' + kv[0] + ' (' + kv[1] + ')</option>');
  });
  s.innerHTML = o.join('');
  for (var i = 0; i < s.options.length; i++) { if (s.options[i].value === cv) { s.selectedIndex = i; break; } }
}

document.querySelectorAll('th[data-sort]').forEach(function(th) {
  th.addEventListener('click', function() {
    var col = th.dataset.sort;
    if (S.scol === col) S.desc = !S.desc;
    else { S.scol = col; S.desc = col === 'score' || col === 'speed'; }
    document.querySelectorAll('th').forEach(function(t) { t.classList.remove('sa','sd'); });
    th.classList.add(S.desc ? 'sd' : 'sa');
    refreshTable();
  });
});

// Context Menu
function showCtx(e, a) {
  e.preventDefault();
  S.selAddr = a;
  var m = $('ctxMenu');
  if (!m) return;
  m.style.display = 'block';
  m.style.left = e.pageX + 'px';
  m.style.top = e.pageY + 'px';
  var items = m.querySelectorAll('.ci span');
  if (items.length >= 3) { items[0].textContent = tr('ctx_use'); items[1].textContent = tr('ctx_del'); items[2].textContent = tr('ctx_copy'); }
  var exclLbl = $('ctxExcludeLbl');
  if (exclLbl) exclLbl.textContent = S.excludedSet.has(a) ? tr('ctx_unexcl') : tr('ctx_excl');
}
document.addEventListener('click', function() { var m = $('ctxMenu'); if (m) m.style.display = 'none'; });

function useSelProxy() {
  if (!S.selAddr) return;
  api('/proxy/use', 'POST', { proxy: S.selAddr }).then(function(r) {
    if (r && r.success) {
      var disp = $('curProxyDisp');
      if (disp) disp.textContent = r.proxyInfo ? r.proxyInfo.proxy : S.selAddr;
      showToast((lang==='zh'?'已切换到：':'Switched to: ') + (r.proxyInfo?r.proxyInfo.proxy:S.selAddr), 'ok');
      log(tr('lrot')+S.selAddr, 'ok');
    }
  });
}
function delSelProxy() {
  if (!S.selAddr) return;
  api('/proxy/remove', 'POST', { proxy: S.selAddr }).then(function(r) {
    if (r && r.success) {
      S.proxies = S.proxies.filter(function(p){return p.proxy!==S.selAddr;});
      S.dSet.delete(S.selAddr);
      showToast(tr('tdel')+S.selAddr);
      refreshTable();
    }
  });
}
function copyAddr() { if(!S.selAddr)return; navigator.clipboard.writeText(S.selAddr); showToast(tr('tcop')+S.selAddr,'ok'); }
function copySingle(a) { navigator.clipboard.writeText(a); showToast(tr('tcop')+a,'ok'); }

// 排除功能
function toggleRowSel(e, addr) {
  e.stopPropagation();
  if (S.selectedSet.has(addr)) S.selectedSet.delete(addr);
  else S.selectedSet.add(addr);
  var row = e.target.closest('tr');
  if (row) {
    if (S.selectedSet.has(addr)) row.classList.add('row-sel');
    else row.classList.remove('row-sel');
  }
  // 更新全选框
  var chkAll = $('chkAll');
  if (chkAll) {
    var tb = $('tblBody');
    var visAddrs = tb ? Array.from(tb.querySelectorAll('tr')).map(function(r){return r.dataset.addr;}).filter(Boolean) : [];
    var allSel = visAddrs.length > 0 && visAddrs.every(function(a){return S.selectedSet.has(a);});
    chkAll.checked = allSel;
    chkAll.indeterminate = !allSel && visAddrs.some(function(a){return S.selectedSet.has(a);});
  }
  updBtns();
}

function toggleSelectAll(chk) {
  var tb = $('tblBody');
  if (!tb) return;
  var rows = tb.querySelectorAll('tr');
  rows.forEach(function(row) {
    var addr = row.dataset.addr;
    if (!addr) return;
    if (chk.checked) {
      S.selectedSet.add(addr);
      row.classList.add('row-sel');
    } else {
      S.selectedSet.delete(addr);
      row.classList.remove('row-sel');
    }
    var cb = row.querySelector('input[type=checkbox]');
    if (cb) cb.checked = chk.checked;
  });
  updBtns();
}

async function toggleExcludeSelProxy() {
  if (!S.selAddr) return;
  var addr = S.selAddr;
  if (S.excludedSet.has(addr)) {
    var r = await api('/proxy/exclusions/remove', 'POST', { proxies: [addr] });
    if (r == null) return;
    S.excludedSet.delete(addr);
    showToast(tr('tunexcl') + addr, 'in');
  } else {
    var r2 = await api('/proxy/exclusions/add', 'POST', { proxies: [addr] });
    if (r2 == null) return;
    S.excludedSet.add(addr);
    showToast(tr('texcl') + addr, 'wa');
  }
  refreshTable();
}

async function excludeSelected() {
  if (S.selectedSet.size === 0) { showToast(tr('no_sel'), 'wa'); return; }
  var addrs = [...S.selectedSet];
  var toExcl = addrs.filter(function(a){ return !S.excludedSet.has(a); });
  var toUnexcl = addrs.filter(function(a){ return S.excludedSet.has(a); });
  if (toExcl.length) {
    var r1 = await api('/proxy/exclusions/add', 'POST', { proxies: toExcl });
    if (r1 != null) toExcl.forEach(function(a){ S.excludedSet.add(a); });
  }
  if (toUnexcl.length) {
    var r2 = await api('/proxy/exclusions/remove', 'POST', { proxies: toUnexcl });
    if (r2 != null) toUnexcl.forEach(function(a){ S.excludedSet.delete(a); });
  }
  S.selectedSet.clear();
  var msg = toExcl.length ? tr('texcl') + toExcl.length : '';
  if (toUnexcl.length) msg += (msg ? ' / ' : '') + tr('tunexcl') + toUnexcl.length;
  showToast(msg, 'in');
  refreshTable();
}

async function clearExclusions() {
  if (S.excludedSet.size === 0) return;
  if (!confirm(tr('cclear_excl'))) return;
  try {
    var res = await api('/proxy/exclusions/clear', 'POST');
    if (res == null) { showToast(tr('excl_clear_fail') || 'Failed to clear exclusions', 'er'); return; }
    S.excludedSet.clear();
    showToast(tr('excl_cleared'), 'in');
    refreshTable();
  } catch(e) {
    showToast(tr('excl_clear_fail') || 'Failed to clear exclusions', 'er');
  }
}

function updExclBadge() {
  var badge = $('exclBadge');
  if (!badge) return;
  var cnt = S.excludedSet.size;
  if (cnt > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = cnt + ' ' + tr('excl_cnt');
  } else {
    badge.style.display = 'none';
  }
}

// Core Actions
async function startFetch() {
  if (S.running) return;
  S.running = true; S.cancel.cancelled = false;
  setBtn(false); showProg(0);
  log(tr('log_start'));
  try {
    await api('/fetch/start', 'POST');
    showProg(0);
    await pollResults();
  } catch(e) {
    log('[!] '+tr('log_cancelled')+' Error: '+e.message,'er');
    finalizeVal();
  }
}

async function pollResults() {
  // 只要后端没说finished就一直等
  while (S.running) {
    var res = await api('/fetch/results');
    if (!res || res.finished) break;
    var nr = res.results || [];
    for (var i=0;i<nr.length;i++) {
      var p = nr[i];
      if (!p || !p.proxy) continue;
      if (S.dSet.has(p.proxy)) continue;
      if (p.port === 0 || typeof p.port === 'undefined' || p.port == null) continue;
      if (p.status !== 'Working') continue;
      S.dSet.add(p.proxy); S.proxies.push(p);
      appendProxyRow(p);
      log(tr('log_success')+p.proxy+tr('log_sep')+(p.score||0).toFixed(1)+tr('log_lat')+((p.latency||0)*1000).toFixed(1)+tr('log_ms'),'ok');
    }
    // 实时更新统计数字 + loading效果
    updStats();
    var pr = res.progress || {};
    updProg(pr.current||0, pr.max||0);
    await new Promise(function(r){setTimeout(r,800);});
  }
  finalizeVal();
}

/** 渲染单行并追加到表格 – 仅在第一页且未超出 pageSize 时插入 DOM */
function appendProxyRow(p) {
  var tb = $('tblBody'), emp = $('emptySt');
  if (!tb) return;
  if (emp) emp.style.display = 'none';
  // Only live-insert on page 0 and when within the page limit
  if (S.page !== 0 || tb.children.length >= S.pageSize) return;
  var row = _makeRow(p);
  row.classList.add('row-new');
  tb.insertBefore(row, tb.firstChild);
  setTimeout(function(){ row.classList.remove('row-new'); }, 600);
}

/** 更新可用/总数统计（缓存 Working 计数避免重复 filter） */
function updStats() {
  S.cachedWorking = S.proxies.filter(function(p){return p.status==='Working';}).length;
  var wc = S.cachedWorking;
  var tot = S.proxies.length;
  var ts = $('tblStats');
  if (ts) {
    ts.textContent = wc + '/' + tot;
    ts.classList.add('stat-flash');
    setTimeout(function(){ ts.classList.remove('stat-flash'); }, 300);
  }
  var ct = $('pcTxt');
  if (ct) ct.textContent = wc + '/' + tot;
}

function finalizeVal() {
  S.running=false; setBtn(true);
  updStats(); // refresh cached working count before using it
  // 进度条保留最终状态，显示完成信息
  var pc = $('progC');
  if (pc) {
    var pb = $('progBar'); if (pb) pb.style.width = '100%';
    setTxt('progTxt', tr('log_complete'));
  }
  refreshTable();
  var w = S.cachedWorking;
  var tot=S.proxies.length;
  log(tr('log_complete'));
  log(w+tr('log_avail'), w>0?'ok':'wa');
  showToast(tr('done_fmt')+w+tr('done_total')+tot, w>0?'ok':'in');
}

function cancelTask() {
  if (!S.running) return;
  S.cancel.cancelled=true;
  api('/fetch/cancel','POST');
  S.running=false; setBtn(true);
  // 进度条显示取消状态
  setTxt('progTxt', tr('log_cancelled'));
  refreshTable();
  log(tr('log_cancelled'),'wa');
  showToast(tr('log_cancelled'),'wa');
}

async function importProxies() {
  var inp=document.createElement('input'); inp.type='file'; inp.accept='.txt,.json';
  inp.onchange=async function(e){
    var file=e.target.files[0]; if(!file)return;
    var fd=new FormData(); fd.append('file',file);
    S.running=true; S.cancel.cancelled=false; setBtn(false); showProg(0);
    log(tr('log_importing')+file.name+'...');
    var res=await fetch('/api/proxy/import',{method:'POST',body:fd}).then(function(r){return r.json();});
    if(res.success){showProg(res.count||0);await pollResults();}
    else{showToast(res.error||tr('import_fail'),'er');finalizeVal();}
  };
  inp.click();
}

async function clearAll() {
  if(S.running){showToast(tr('wait_task'),'wa');return;}
  if(!confirm(tr('cclear')))return;
  await api('/proxy/clear','POST');
  S.proxies=[];S.dSet.clear();S.selectedSet.clear();S.page=0;S.cachedWorking=0;stopAutoRot();refreshTable();
  log(tr('log_cleared'),'wa');
  showToast(tr('tclr'),'in');
}

async function revalidateAll() {
  if(S.running)return;
  if(!S.proxies.length){showToast(tr('empty_pool'),'wa');return;}
  S.running=true;S.cancel.cancelled=false;setBtn(false);
  log(tr('log_reval'));
  await api('/proxy/revalidate','POST');
  showProg(S.proxies.length);
  await pollResults();
}

async function exportProxies() {
  var fmt=prompt(tr('fmt_choose'),tr('fmt_txt'));
  if(!fmt)return;
  var res=await api('/proxy/export?format='+fmt.toLowerCase());
  if(res&&res.success){
    var blob=new Blob([res.data],{type:'text/plain;charset=utf-8'}),
        url=URL.createObjectURL(blob),
        a=document.createElement('a');
    a.href=url;a.download='proxies.'+fmt.toLowerCase();a.click();URL.revokeObjectURL(url);
    showToast(tr('texp')+res.count,'ok');
  }
}

async function rotateProxy() {
  var rf=$('regionFilter'),
      rs=rf?rf.value:'',
      region=rs?rs.replace(/\s*\(\d+\)$/,''):'All',
      qc=$('qualityCheck'),
      uq=qc?qc.checked:false,
      qlEl=$('qualityLatency'),
      ql=uq&&qlEl?parseInt(qlEl.value):null;
  var res=await api('/proxy/rotate','POST',{region:region,qualityLatencyMs:ql});
  if(res&&res.success&&res.proxy){
    var disp=$('curProxyDisp');
    if(disp)disp.textContent=res.proxy.proxy;
    log(tr('lrot')+res.proxy.protocol+'://'+res.proxy.proxy,'ok');
  }else{
    var disp=$('curProxyDisp');
    if(disp)disp.textContent='N/A';
    showToast(tr('no_proxy'),'wa');
  }
}

async function toggleAutoRotate(){
  if(S.autoRot){
    stopAutoRot();
  }
  else{
    var ai=$('autoInterval'),
        iv=ai?parseInt(ai.value)||10:10;
    if(iv<0||isNaN(iv)){showToast(tr('invalid_interval'),'er');return;}
    S.autoRot=true;
    try{await api('/server/auto-rotate','POST',{enabled:true,intervalSec:iv});}catch(e){}
    if(iv===0)log(tr('log_auto_on')+tr('log_auto_per'),'ok');
    else log(tr('log_auto_on')+iv+tr('log_auto_sec'),'ok');
    if(iv>0)doAutoRot(iv);
  }
  updBtns();
}
function syncCurProxyDisp(){
  var cp=S.proxies.find(function(p){return p.status==='Working';});
  var disp=$('curProxyDisp');
  if(disp)disp.textContent=cp?cp.proxy:'N/A';
}

function doAutoRot(iv){if(!S.autoRot||iv<=0)return;S.autoTimer=setTimeout(function(){rotateProxy().then(function(){doAutoRot(iv);});},iv*1000);}
function stopAutoRot(){
  S.autoRot=false;
  if(S.autoTimer)clearTimeout(S.autoTimer);
  S.autoTimer=null;
  api('/server/auto-rotate','POST',{enabled:false});
  syncCurProxyDisp();
  log(tr('log_auto_off'));updBtns();
}

function testProxy(){openTestModal();}

function openTestModal(){
  var m=$('testModal');if(m){m.classList.add('act');lucide.createIcons({attrs:{strokeWidth:1.5}});}
}
function closeTestModal(){var m=$('testModal');if(m)m.classList.remove('act');}

function onTestUrlPresetChange(){
  var sel=$('testUrlPreset'),cw=$('testUrlCustomWrap');
  if(!sel||!cw)return;
  cw.style.display=sel.value==='custom'?'block':'none';
}

async function runProxyTest(){
  var sel=$('testUrlPreset'),ci=$('testUrlCustom');
  var url=sel&&sel.value!=='custom'?sel.value:(ci?ci.value.trim():'');
  if(!url){return;}
  var rb=$('testRunBtn');if(rb)rb.disabled=true;
  var rd=$('testResult');
  if(rd){rd.textContent='';var si=document.createElement('span');si.style.opacity='.6';si.textContent=tr('test_running');rd.appendChild(si);}
  try{
    var res=await api('/server/test?url='+encodeURIComponent(url),'GET');
    if(rd){
      rd.textContent='';
      var sp=document.createElement('span');
      if(res&&res.success){
        sp.style.color='var(--ok)';
        var msg=tr('test_res_ok')+String(res.statusCode||'')+tr('test_res_lat')+String(res.latencyMs||0)+'ms';
        if(res.exitIp)msg+=tr('test_res_ip')+String(res.exitIp);
        if(res.upstreamProxy)msg+=tr('test_res_via')+String(res.upstreamProtocol||'')+'://'+String(res.upstreamProxy);
        sp.textContent=msg;
      }else{
        sp.style.color='var(--err)';
        sp.textContent=tr('test_res_fail')+(res&&res.error?String(res.error):'unknown');
      }
      rd.appendChild(sp);
    }
  }catch(e){
    if(rd){rd.textContent='';var se=document.createElement('span');se.style.color='var(--err)';se.textContent=tr('test_res_fail')+e.message;rd.appendChild(se);}
  }finally{
    if(rb)rb.disabled=false;
  }
}

async function restartServer(){
  var btn=$('btnRestart');if(btn)btn.disabled=true;
  try{
    var res=await api('/server/restart','POST');
    if(res&&res.success){
      S.server=true;
      var dot=$('svDot');if(dot)dot.className='sdot on';
      setTxt('svTxt',tr('on'));
      log(tr('restart_ok'),'ok');
      showToast(tr('restart_ok'),'ok');
    }else{
      showToast(tr('restart_fail')+(res&&res.error||''),'er');
    }
  }catch(e){
    showToast(tr('restart_fail')+e.message,'er');
  }finally{
    updBtns();
  }
}

async function toggleServer(){
  if(S.server){
    var res=await api('/server/stop','POST');
    if(res&&res.success){
      S.server=false;
      var dot=$('svDot');if(dot)dot.className='sdot off';
      setTxt('svTxt',tr('off'));
      log(tr('lsrvs'));updBtns();
    }
  }else{
    var res2=await api('/server/start','POST');
    if(res2&&res2.success){
      S.server=true;
      var dot=$('svDot');if(dot)dot.className='sdot on';
      setTxt('svTxt',tr('on'));
      log(tr('lsrvc'),'ok');updBtns();
      showToast(tr('service_started'),'ok');
    }else{showToast(res2&&res2.error||tr('start_failed'),'er');}
  }
}

// Log Stream (SSE)
var _logStreamES=null;
function startLogStream(){
  if(_logStreamES){try{_logStreamES.close();}catch(e){}_logStreamES=null;}
  var es=new EventSource('/api/logs/stream');
  _logStreamES=es;
  es.onmessage=function(ev){
    try{var m=JSON.parse(ev.data);log(m.message,m.level||'normal');}catch(e){log(ev.data);}
  };
  es.onerror=function(){try{es.close();}catch(e){}_logStreamES=null;setTimeout(startLogStream,3000);};
}

// Help Modal
function openHelp(){renderHelp();var hm=$('helpModal');if(hm)hm.classList.add('act');}
function closeHelp(){var hm=$('helpModal');if(hm)hm.classList.remove('act');}

function renderHelp(){
  var hb=$('helpBody');
  if(!hb)return;
  var isZh=lang==='zh';
  hb.innerHTML=
    '<h3><i data-lucide="rocket" style="color:var(--accent)"></i> '+(isZh?'什么是 ProxyPulse？':'What is ProxyPulse?')+'</h3>'+
    '<p>'+(isZh?'<b>ProxyPulse</b> 是一个基于 Node.js 的免费代理池管理工具，可以自动从全网采集、验证并管理免费 HTTP/SOCKS 代理。无需 Python 环境，一键启动即用。':'<b>ProxyPulse</b> is a Node.js-based free proxy pool manager that automatically scrapes, validates and manages free HTTP/SOCKS proxies. No Python needed.')+'</p>'+
    '<div class="fg">'+
    '<div class="fc"><strong>'+(isZh?'⚡ 一键启动':'⚡ One-click Start')+'</strong><span>'+(isZh?'npm start 即可运行':'Run npm start')+'</span></div>'+
    '<div class="fc"><strong>'+(isZh?'🌐 多协议支持':'🌐 Multi-Protocol')+'</strong><span>HTTP + SOCKS4 + SOCKS5</span></div>'+
    '<div class="fc"><strong>'+(isZh?'🔍 30+ 数据源':'🔍 30+ Sources')+'</strong><span>'+(isZh?'公开 API + 爬虫站点':'Public APIs + scrapers')+'</span></div>'+
    '<div class="fc"><strong>'+(isZh?'✨ 智能验证':'✨ Smart Validation')+'</strong><span>TCP预检 + 延迟/匿名度/速度/地理</span></div>'+
    '<div class="fc"><strong>'+(isZh?'🔄 IP 轮换':'🔄 IP Rotation')+'</strong><span>'+(isZh?'手动/自动/逐请求':'Manual/auto/per-request')+'</span></div>'+
    '<div class="fc"><strong>'+(isZh?'🎮 本地代理服务':'🎮 Local Proxy Server')+'</strong><span>HTTP:1801 / SOCKS5:1800</span></div>'+
    '</div>'+
    '<h3><i data-lucide="play-circle" style="color:var(--accent)"></i> '+(isZh?'快速开始':'Quick Start')+'</h3>'+
    '<ol>'+
    '<li>'+(isZh?'运行 <code>npm start</code> 启动':'Run <code>npm start</code>')+'</li>'+
    '<li>'+(isZh?'打开 <code>http://localhost:3456</code>':'Open <code>http://localhost:3456</code>')+'</li>'+
    '<li>'+(isZh?'点击「<b>获取代理</b>」':'Click "<b>Fetch Proxies</b>"')+'</li>'+
    '<li>'+(isZh?'验证后点击「<b>启动服务</b>」':'Click "<b>Start Service</b>" after validation')+'</li>'+
    '<li>'+(isZh?'设置代理为 <code>127.0.0.1:1801</code>(HTTP) 或 <code>127.0.0.1:1800</code>(SOCKS5)':'Set proxy to <code>127.0.0.1:1801</code>(HTTP) or <code>127.0.0.1:1800</code>(SOCKS5)')+'</li>'+
    '</ol>'+
    '<h3><i data-lucide="settings" style="color:var(--accent)"></i> '+(isZh?'功能说明':'Features')+'</h3>'+
    '<ul>'+
    '<li><b>'+(isZh?'获取代理':'Fetch')+'</b> — '+(isZh?'30+源自动采集+TCP预检+质量检测':'30+ sources + TCP pre-check + quality test')+'</li>'+
    '<li><b>'+(isZh?'导入':'Import')+'</b> — .txt/.json</li>'+
    '<li><b>'+(isZh?'重测':'Re-test')+'</b> — '+(isZh?'重新验证已有代理':'Re-validate existing')+'</li>'+
    '<li><b>'+(isZh?'导出':'Export')+'</b> — txt/csv/json</li>'+
    '<li><b>'+(isZh?'IP轮换':'Rotate')+'</b> — '+(isZh?'手动切换代理IP':'Switch proxy manually')+'</li>'+
    '<li><b>'+(isZh?'自动轮换':'Auto-Rotate')+'</b> — '+(isZh?'定时/逐请求切换':'Interval/per-request switch')+'</li>'+
    '<li><b>'+(isZh?'过滤筛选':'Filter')+'</b> — '+(isZh?'按地区/延迟/质量':'By region/latency/quality')+'</li>'+
    '<li><b>'+(isZh?'主题切换':'Theme')+'</b> — '+(isZh?'亮色/暗色':'Light/Dark')+'</li>'+
    '<li><b>'+(isZh?'语言切换':'Language')+'</b> — ZH/EN</li>'+
    '</ul>'+
    '<h3><i data-lucide="alert-triangle" style="color:var(--warn)"></i> '+(isZh?'注意事项':'Warnings')+'</h3>'+
    '<ul>'+
    '<li>'+(isZh?'免费代理不稳定':'Free proxies are unstable')+'</li>'+
    '<li>'+(isZh?'不要传敏感信息':'Do NOT send sensitive data')+'</li>'+
    '<li>'+(isZh?'建议配合自动轮换':'Use with Auto-Rotate')+'</li>'+
    '<li>'+(isZh?'生产环境请用付费代理':'Use paid services for production')+'</li>'+
    '</ul>';
  lucide.createIcons({root:hb,attrs:{strokeWidth:1.5}});
}

// ==================== Auth ====================
var authMode = 'login'; // 'setup' | 'login'

async function checkAuth() {
  var res = await fetch('/api/auth/status').then(function(r){return r.json();}).catch(function(){return null;});
  if (!res) return;
  if (!res.authenticated) {
    authMode = res.hasPassword ? 'login' : 'setup';
    showAuthOverlay(authMode);
  } else {
    var ov = $('authOverlay'); if (ov) ov.classList.remove('act');
  }
}

function showAuthOverlay(mode) {
  authMode = mode;
  var ov = $('authOverlay');
  if (!ov) return;
  ov.classList.add('act');
  var isSetup = mode === 'setup';
  setTxt('authTitle', isSetup ? tr('auth_setup_title') : tr('auth_login_title'));
  setTxt('authSub', isSetup ? tr('auth_setup_sub') : tr('auth_login_sub'));
  setTxt('authPwLabel', tr('auth_pw_label'));
  setTxt('authConfirmLabel', tr('auth_confirm_label'));
  setTxt('authBtn', isSetup ? tr('auth_btn_setup') : tr('auth_btn_login'));
  var cf = $('authConfirmField'); if (cf) cf.style.display = isSetup ? '' : 'none';
  var err = $('authErr'); if (err) err.textContent = '';
  var pw = $('authPw');
  if (pw) {
    pw.setAttribute('autocomplete', isSetup ? 'new-password' : 'current-password');
    pw.value = '';
    pw.focus();
  }
  var cpw = $('authConfirmPw'); if (cpw) cpw.value = '';
}

async function submitAuth(e) {
  if (e) e.preventDefault();
  var pw = $('authPw') ? $('authPw').value : '';
  var err = $('authErr');
  if (err) err.textContent = '';
  if (!pw || pw.length < 6) { if (err) err.textContent = tr('auth_err_short'); return; }
  if (authMode === 'setup') {
    var cpw = $('authConfirmPw') ? $('authConfirmPw').value : '';
    if (pw !== cpw) { if (err) err.textContent = tr('auth_err_mismatch'); return; }
    var res = await fetch('/api/auth/setup', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})}).then(function(r){return r.json();}).catch(function(){return null;});
    if (res && res.success) { var ov=$('authOverlay');if(ov)ov.classList.remove('act'); }
    else if (res && res.error) { if (err) err.textContent = res.error; }
  } else {
    var res2 = await fetch('/api/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})}).then(function(r){return r.json();}).catch(function(){return null;});
    if (res2 && res2.success) { var ov2=$('authOverlay');if(ov2)ov2.classList.remove('act'); }
    else { if (err) err.textContent = tr('auth_err_wrong'); }
  }
}

async function logout() {
  await fetch('/api/auth/logout', {method:'POST'});
  showAuthOverlay('login');
}

// ==================== Settings Modal ====================
function openSettings() {
  api('/settings/get').then(function(res) {
    if (!res || !res.settings) return;
    var s = res.settings;
    if (s.general) {
      var th = $('stThreads'); if (th) th.value = s.general.validationThreads || 100;
      var ft = $('stFailThr'); if (ft) ft.value = s.general.failureThreshold || 3;
    }
    if (s.proxyAuth) {
      var pe = $('stProxyAuthEnabled'); if (pe) pe.checked = !!s.proxyAuth.enabled;
      var pu = $('stProxyUser'); if (pu) pu.value = s.proxyAuth.username || '';
      toggleProxyAuthFields();
    }
    var spw = $('stCurPw'); if (spw) spw.value = '';
    var npw = $('stNewPw'); if (npw) npw.value = '';
    var cpw = $('stCfmPw'); if (cpw) cpw.value = '';
    var ppw = $('stProxyPw'); if (ppw) ppw.value = '';
    var se = $('settingsErr'); if (se) se.textContent = '';
  });
  applySettingsT();
  var m = $('settingsModal'); if (m) m.classList.add('act');
}

function closeSettings() { var m = $('settingsModal'); if (m) m.classList.remove('act'); }

function toggleProxyAuthFields() {
  var cb = $('stProxyAuthEnabled'), f = $('stProxyAuthFields');
  if (f) f.style.display = (cb && cb.checked) ? '' : 'none';
}

function applySettingsT() {
  var d = T[lang];
  setTxt('lblSettingsTitle', d.settings_title);
  setTxt('lblSettingsGeneral', d.settings_general);
  setTxt('lblSettingsAuth', d.settings_auth);
  setTxt('lblSettingsProxyAuth', d.settings_proxy_auth);
  setTxt('lblThreads', d.settings_threads);
  setTxt('lblFailThr', d.settings_fail_thr);
  setTxt('lblCurPw', d.settings_cur_pw);
  setTxt('lblNewPw', d.settings_new_pw);
  setTxt('lblCfmPw', d.settings_cfm_pw);
  setTxt('lblProxyAuthEnable', d.settings_proxy_auth_enable);
  setTxt('lblProxyUser', d.settings_proxy_user);
  setTxt('lblProxyPw', d.settings_proxy_pw);
  setTxt('btnSettingsCancel', d.settings_cancel);
  setTxt('btnSettingsSave', d.settings_save);
}

async function saveSettings() {
  var se = $('settingsErr'); if (se) se.textContent = '';
  var threads = $('stThreads') ? parseInt($('stThreads').value) || 100 : 100;
  var failThr = $('stFailThr') ? parseInt($('stFailThr').value) || 3 : 3;
  var curPw = $('stCurPw') ? $('stCurPw').value : '';
  var newPw = $('stNewPw') ? $('stNewPw').value : '';
  var cfmPw = $('stCfmPw') ? $('stCfmPw').value : '';
  var proxyAuthEnabled = $('stProxyAuthEnabled') ? $('stProxyAuthEnabled').checked : false;
  var proxyUser = $('stProxyUser') ? $('stProxyUser').value.trim() : 'proxy';
  var proxyPw = $('stProxyPw') ? $('stProxyPw').value : '';

  // Validate password change fields
  if (newPw) {
    if (newPw.length < 6) { if (se) se.textContent = tr('settings_err_short'); return; }
    if (newPw !== cfmPw) { if (se) se.textContent = tr('settings_err_mismatch'); return; }
  }

  // Save general + proxyAuth settings
  var settingsPayload = {
    general: { validationThreads: threads, failureThreshold: failThr },
    proxyAuth: { enabled: proxyAuthEnabled, username: proxyUser || 'proxy' }
  };
  if (proxyPw) settingsPayload.proxyAuth.password = proxyPw;

  var r1 = await api('/settings/save', 'POST', { settings: settingsPayload });
  if (!r1) return;

  // Change web auth password if requested
  if (newPw) {
    var r2 = await fetch('/api/auth/change-password', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:curPw,newPassword:newPw})}).then(function(r){return r.json();}).catch(function(){return null;});
    if (!r2 || !r2.success) { if (se) se.textContent = r2 && r2.error ? r2.error : tr('settings_err_cur_pw'); return; }
    closeSettings();
    showToast(tr('settings_pw_changed'), 'wa');
    var stillAuthenticated = await fetch('/api/auth/status').then(function(r){return r.json();}).then(function(r){return r && r.authenticated;}).catch(function(){return false;});
    if (!stillAuthenticated) showAuthOverlay('login');
    return;
  }

  S.settings.general = { validationThreads: threads, failureThreshold: failThr };
  closeSettings();
  showToast(tr('settings_saved'), 'ok');
}

// Init
function loadProxiesIntoTable(proxies) {
  if (!proxies || !proxies.length) return;
  for (var i = 0; i < proxies.length; i++) {
    var p = proxies[i];
    if (!p || !p.proxy || S.dSet.has(p.proxy)) continue;
    S.dSet.add(p.proxy);
    S.proxies.push(p);
  }
  refreshTable();
  updStats();
  updBtns();
}

window.onload=function(){
  lucide.createIcons({attrs:{strokeWidth:1.5}});
  if(theme!=='dark')document.documentElement.setAttribute('data-theme',theme);
  var ti=$('thIcon');
  if(ti&&theme==='light')ti.setAttribute('data-lucide','sun');
  lucide.createIcons({attrs:{strokeWidth:1.5}});
  applyT();
  checkAuth();
  startLogStream();
  api('/settings/get').then(function(res){if(res&&res.settings)S.settings=res.settings;});
  api('/proxy/exclusions').then(function(res){if(res&&res.excluded){S.excludedSet=new Set(res.excluded);updExclBadge();}});
  // Restore proxy pool and task state
  api('/proxy/list').then(function(res){
    if(res&&res.proxies&&res.proxies.length){
      loadProxiesIntoTable(res.proxies);
      var wc=S.proxies.filter(function(p){return p.status==='Working';}).length;
      log(tr('pool_restored')+wc+'/'+S.proxies.length,'info');
      showToast(tr('pool_restored')+wc,'ok');
    }
  });
  api('/status').then(function(res){
    if(res&&res.serverRunning){
      S.server=true;
      var dot=$('svDot');if(dot)dot.className='sdot on';
      setTxt('svTxt',tr('on'));
    }
    if(res&&res.isRunningTask&&!S.running){
      S.running=true; S.cancel.cancelled=false;
      setBtn(false); showProg(res.progress?res.progress.max:0);
      log(tr('pool_task_resumed'),'in');
      pollResults();
    }
    // 恢复当前代理显示
    if(res&&res.serverRunning) syncCurProxyDisp();
    updBtns();
  });
  log(tr('log_loaded'),'ok');
  log(tr('ltip'),'in');
};

// Close modal on overlay click
var hm=$('helpModal');
if(hm)hm.addEventListener('click',function(e){if(e.target===this)closeHelp();});
var sm=$('settingsModal');
if(sm)sm.addEventListener('click',function(e){if(e.target===this)closeSettings();});
var tm=$('testModal');
if(tm)tm.addEventListener('click',function(e){if(e.target===this)closeTestModal();});
