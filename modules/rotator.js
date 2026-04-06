/**
 * ProxyRotator - 代理轮换管理器
 * 负责管理、筛选、轮换代理
 */
const EventEmitter = require('events');

class ProxyRotator extends EventEmitter {
  constructor() {
    super();
    this.allProxies = [];
    this.currentProxy = null;
    
    // 筛选条件
    this.filterRegion = 'All';
    this.filterQualityLatencyMs = null;
    
    // 轮换索引（按区域+质量组合）
    this.indices = {};

    // 全局排除列表
    this.excludedProxies = new Set();
  }

  /**
   * 清空所有代理
   */
  clear() {
    this.allProxies = [];
    this.currentProxy = null;
    this.indices = {};
  }

  /**
   * 添加代理到排除列表（支持单个或多个）
   */
  addExclusion(proxyAddresses) {
    const list = Array.isArray(proxyAddresses) ? proxyAddresses : [proxyAddresses];
    list.forEach(a => this.excludedProxies.add(a));
  }

  /**
   * 从排除列表中移除代理（支持单个或多个）
   */
  removeExclusion(proxyAddresses) {
    const list = Array.isArray(proxyAddresses) ? proxyAddresses : [proxyAddresses];
    list.forEach(a => this.excludedProxies.delete(a));
  }

  /**
   * 清空排除列表
   */
  clearExclusions() {
    this.excludedProxies.clear();
  }

  /**
   * 获取排除列表（数组形式）
   */
  getExcludedProxies() {
    return [...this.excludedProxies];
  }

  /**
   * 判断某个代理是否在排除列表中
   */
  isExcluded(proxyAddress) {
    return this.excludedProxies.has(proxyAddress);
  }

  /**
   * 设置筛选条件
   */
  setFilters(region = 'All', qualityLatencyMs = null) {
    this.filterRegion = region;
    this.filterQualityLatencyMs = qualityLatencyMs;
  }

  /**
   * 添加新代理（去重）
   */
  addProxy(proxyInfo) {
    const address = proxyInfo.proxy;
    const exists = this.allProxies.some(p => p.proxy === address);
    if (exists) return false;

    proxyInfo.consecutiveFailures = proxyInfo.consecutiveFailures || 0;
    proxyInfo.status = proxyInfo.status || 'Working';
    this.allProxies.push(proxyInfo);
    
    this.emit('proxyAdded', proxyInfo);
    return true;
  }

  /**
   * 移除指定代理
   */
  removeProxy(proxyAddress) {
    const idx = this.allProxies.findIndex(p => p.proxy === proxyAddress);
    if (idx === -1) return false;

    const removed = this.allProxies.splice(idx, 1)[0];
    if (this.currentProxy && this.currentProxy.proxy === proxyAddress) {
      this.currentProxy = null;
    }
    
    this.emit('proxyRemoved', removed);
    return true;
  }

  /**
   * 报告代理失败
   */
  reportFailure(proxyAddress) {
    const p = this.allProxies.find(p => p.proxy === proxyAddress);
    if (p) {
      p.status = 'Unavailable';
      this.emit('proxyFailed', p);
    }
  }

  /**
   * 根据地址查询代理
   */
  getProxyByAddress(proxyAddress) {
    return this.allProxies.find(p => p.proxy === proxyAddress) || null;
  }

  /**
   * 更新代理信息
   */
  updateProxy(proxyAddress, updateData) {
    const p = this.allProxies.find(p => p.proxy === proxyAddress);
    if (p) {
      Object.assign(p, updateData);
      this.emit('proxyUpdated', p);
      return true;
    }
    return false;
  }

  /**
   * 获取所有代理副本（用于重新验证）
   */
  getAllProxiesForRevalidation() {
    return [...this.allProxies];
  }

  /**
   * 统计可用代理数量
   */
  getActiveProxiesCount() {
    return this.allProxies.filter(p => p.status === 'Working').length;
  }

  /**
   * 按地区统计可用代理数量
   */
  getAvailableRegionsWithCounts(qualityLatencyMs = null) {
    const counts = {};
    for (const p of this.allProxies) {
      if (p.status !== 'Working') continue;
      
      if (qualityLatencyMs !== null) {
        const latencyMs = (p.latency || Infinity) * 1000;
        if (latencyMs > qualityLatencyMs) continue;
      }

      const region = p.location || 'Unknown';
      counts[region] = (counts[region] || 0) + 1;
    }
    return counts;
  }

  /**
   * 获取下一个可用代理（轮换）
   */
  getNextProxy() {
    const candidates = this._getFilteredCandidates();
    
    if (candidates.length === 0) {
      // 放宽条件重试
      if (this.filterRegion !== 'All' || this.filterQualityLatencyMs !== null) {
        const origRegion = this.filterRegion;
        const origLatency = this.filterQualityLatencyMs;
        this.setFilters('All', null);
        const result = this.getNextProxy();
        this.setFilters(origRegion, origLatency);
        return result;
      }

      this.currentProxy = null;
      return null;
    }

    // 按分数排序
    candidates.sort((a, b) => (b.score || 0) - (a.score || 0));

    // 轮换索引
    const qKey = this.filterQualityLatencyMs != null ? `lt${this.filterQualityLatencyMs}` : 'any';
    const indexKey = `${this.filterRegion}_${qKey}`;
    let currentIdx = this.indices[indexKey] || -1;
    const nextIdx = (currentIdx + 1) % candidates.length;
    this.indices[indexKey] = nextIdx;

    this.currentProxy = candidates[nextIdx];
    this.emit('proxyRotated', this.currentProxy);
    return this.currentProxy;
  }

  /**
   * 获取当前正在使用的代理
   */
  getCurrentProxy() {
    if (this.currentProxy && this.currentProxy.status !== 'Working') {
      this.currentProxy = null;
    }
    return this.currentProxy;
  }

  /**
   * 根据地址手动设置当前代理
   */
  setCurrentProxyByAddress(proxyAddress) {
    const p = this.allProxies.find(
      p => p.proxy === proxyAddress && p.status === 'Working'
    );
    if (p) {
      this.currentProxy = p;
      this.emit('proxySetManually', p);
      return p;
    }
    return null;
  }

  /**
   * 获取符合条件的候选代理列表
   */
  _getFilteredCandidates() {
    return this.allProxies.filter(p => {
      if (p.status !== 'Working') return false;
      if (this.excludedProxies.has(p.proxy)) return false;

      const regionMatch = (this.filterRegion === 'All') || 
                          (p.location === this.filterRegion);

      let qualityMatch = true;
      if (this.filterQualityLatencyMs != null) {
        const latencyMs = (p.latency || Infinity) * 1000;
        qualityMatch = latencyMs <= this.filterQualityLatencyMs;
      }

      return regionMatch && qualityMatch;
    });
  }
}

module.exports = ProxyRotator;
