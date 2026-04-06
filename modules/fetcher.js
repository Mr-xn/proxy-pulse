/**
 * ProxyFetcher - 多源代理获取模块
 * 从公开 API 和网页爬虫获取免费代理
 */
const axios = require('axios');
const cheerio = require('cheerio');

class ProxyFetcher {
  constructor() {
    this.session = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'Referer': 'https://www.google.com/'
      }
    });

    // API 源（返回纯文本/JSON 格式）
    this.onlineSources = {
      http: [
        'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http',
        'https://openproxylist.xyz/http.txt',
        'https://www.proxy-list.download/api/v1/get?type=http',
        'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
        'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/results/http/proxies.txt',
        'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
        'https://raw.githubusercontent.com/prxchk/proxy-list/main/all.txt',
        'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
        'https://raw.githubusercontent.com/zloi-user/hideip.me/main/http.txt',
        'https://www.proxyscan.io/api/proxy?type=http&format=txt',
        'https://api.openproxylist.xyz/http.txt',
      ],
      socks5: [
        'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=socks5',
        'https://openproxylist.xyz/socks5.txt',
        'https://www.proxy-list.download/api/v1/get?type=socks5',
        'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt',
        'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/results/socks5/proxies.txt',
        'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt',
        'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
        'https://raw.githubusercontent.com/ProxyScraper/ProxyScraper/main/socks5.txt',
        'https://www.proxyscan.io/api/proxy?type=socks5&format=txt',
        'https://api.openproxylist.xyz/socks5.txt',
      ],
      socks4: [
        'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=socks4',
        'https://openproxylist.xyz/socks4.txt',
        'https://www.proxy-list.download/api/v1/get?type=socks4',
        'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks4.txt',
        'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks4.txt',
        'https://api.openproxylist.xyz/socks4.txt',
      ]
    };

    // 混合协议源（包含协议前缀的代理列表）
    this.mixedSources = [
      'https://github.com/proxifly/free-proxy-list/raw/refs/heads/main/proxies/all/data.txt',
    ];

    // 爬虫源（需要解析 HTML 的网站）
    this.scrapingSources = [
      { func: this._scrapeFreeProxyList.bind(this), protocol: 'http' },
      { func: this._scrapeKuaidaili.bind(this), protocol: 'http' },
      { func: this._scrapeIp3366.bind(this), protocol: 'http' },
      { func: this._scrape89ip.bind(this), protocol: 'http' },
      { func: this._scrapeProxyDb.bind(this), protocol: 'http' },
      { func: this._scrapeGeonode.bind(this), protocol: 'http' },
    ];
  }

  /**
   * 从文本内容解析代理列表
   */
  _parseProxiesFromText(text) {
    try {
      const data = JSON.parse(text);
      if (data.data && Array.isArray(data.data)) {
        return data.data.map(item => `${item.ip}:${item.port}`);
      }
    } catch (e) {}
    
    const proxyPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}/;
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => proxyPattern.test(line));
  }

  /**
   * 从 URL 获取代理
   */
  async _fetchFromUrl(url, logFn) {
    const displayUrl = url.split('/')[2];
    logFn(`[*] (API) Fetching from ${displayUrl}...`);
    try {
      const response = await this.session.get(url);
      const proxies = this._parseProxiesFromText(response.data);
      if (proxies && proxies.length > 0) {
        logFn(`[+] (API) ${displayUrl}: ${proxies.length} proxies`);
        return proxies;
      } else {
        return null;
      }
    } catch (e) {
      logFn(`[!] (API) ${displayUrl} failed: ${e.message.slice(0, 60)}`);
      return null;
    }
  }

  /** 爬取 free-proxy-list.net */
  async _scrapeFreeProxyList(logFn) {
    logFn(`[*] (Scrape) free-proxy-list.net...`);
    try {
      const response = await this.session.get('https://free-proxy-list.net/');
      const $ = cheerio.load(response.data);
      const proxies = new Set();
      
      $('table.table-striped tr').each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length > 6 && $(cols[6]).text().trim() === 'yes') {
          const ip = $(cols[0]).text().trim();
          const port = $(cols[1]).text().trim();
          proxies.add(`${ip}:${port}`);
        }
      });
      
      const result = Array.from(proxies);
      logFn(`[+] (Scrape) free-proxy-list.net: ${result.length} proxies`);
      return result.length > 0 ? result : null;
    } catch (e) {
      logFn(`[!] (Scrape) free-proxy-list.net failed: ${e.message.slice(0, 50)}`);
      return null;
    }
  }

  /** 爬取快代理 kuaidaili.com */
  async _scrapeKuaidaili(logFn) {
    logFn(`[*] (Scrape) kuaidaili.com...`);
    const proxies = new Set();
    try {
      for (let page = 1; page <= 2; page++) {
        const response = await this.session.get(`https://www.kuaidaili.com/free/inha/${page}/`);
        const $ = cheerio.load(response.data);
        $('table tbody tr').each((_, row) => {
          const cols = $(row).find('td');
          if (cols.length > 1) {
            const ip = $(cols[0]).text().trim();
            const port = $(cols[1]).text().trim();
            proxies.add(`${ip}:${port}`);
          }
        });
        await new Promise(r => setTimeout(r, 1000));
      }
      const result = Array.from(proxies);
      logFn(`[+] (Scrape) kuaidaili.com: ${result.length} proxies`);
      return result.length > 0 ? result : null;
    } catch (e) {
      logFn(`[!] (Scrape) kuaidaili.com failed: ${e.message.slice(0, 50)}`);
      return null;
    }
  }

  /** 爬取云代理 ip3366.net */
  async _scrapeIp3366(logFn) {
    logFn(`[*] (Scrape) ip3366.net...`);
    const proxies = new Set();
    try {
      for (let page = 1; page <= 2; page++) {
        const response = await this.session.get(`http://www.ip3366.net/free/?stype=1&page=${page}`);
        const $ = cheerio.load(response.data);
        $('#list tbody tr').each((_, row) => {
          const cols = $(row).find('td');
          if (cols.length > 1) {
            const ip = $(cols[0]).text().trim();
            const port = $(cols[1]).text().trim();
            proxies.add(`${ip}:${port}`);
          }
        });
        await new Promise(r => setTimeout(r, 1000));
      }
      const result = Array.from(proxies);
      logFn(`[+] (Scrape) ip3366.net: ${result.length} proxies`);
      return result.length > 0 ? result : null;
    } catch (e) {
      logFn(`[!] (Scrape) ip3366.net failed: ${e.message.slice(0, 50)}`);
      return null;
    }
  }

  /** 爬取 89ip.cn */
  async _scrape89ip(logFn) {
    logFn(`[*] (Scrape) 89ip.cn...`);
    const proxies = new Set();
    try {
      for (let page = 1; page <= 2; page++) {
        const response = await this.session.get(`https://www.89ip.cn/index_${page}.html`);
        const $ = cheerio.load(response.data);
        $('table.layui-table tbody tr').each((_, row) => {
          const cols = $(row).find('td');
          if (cols.length > 1) {
            const ip = $(cols[0]).text().trim();
            const port = $(cols[1]).text().trim();
            proxies.add(`${ip}:${port}`);
          }
        });
        await new Promise(r => setTimeout(r, 1000));
      }
      const result = Array.from(proxies);
      logFn(`[+] (Scrape) 89ip.cn: ${result.length} proxies`);
      return result.length > 0 ? result : null;
    } catch (e) {
      logFn(`[!] (Scrape) 89ip.cn failed: ${e.message.slice(0, 50)}`);
      return null;
    }
  }

  /** 爬取 proxydb.net */
  async _scrapeProxyDb(logFn) {
    logFn(`[*] (Scrape) proxydb.net...`);
    const proxies = new Set();
    try {
      const response = await this.session.get('https://proxydb.net/?protocol=https&offset=0');
      const $ = cheerio.load(response.data);
      $('tbody tr').each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length >= 2) {
          const aTag = $(cols[0]).find('a');
          const text = aTag.text().trim();
          if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(text)) {
            proxies.add(text);
          }
        }
      });
      const result = Array.from(proxies);
      logFn(`[+] (Scrape) proxydb.net: ${result.length} proxies`);
      return result.length > 0 ? result : null;
    } catch (e) {
      logFn(`[!] (Scrape) proxydb.net failed: ${e.message.slice(0, 50)}`);
      return null;
    }
  }

  /**
   * 从包含协议前缀的混合列表获取代理
   * 格式如: http://1.2.3.4:8080, socks4://1.2.3.4:1080, socks5://1.2.3.4:1080
   */
  async _fetchMixedSource(url, logFn) {
    const displayUrl = url.split('/')[2];
    logFn(`[*] (API) Fetching mixed source from ${displayUrl}...`);
    try {
      const response = await this.session.get(url);
      const result = { http: [], socks4: [], socks5: [] };
      const ipPortPattern = /^((?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)){3}):(\d{1,5})$/;
      const lines = String(response.data).split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const stripped = line.replace(/^(https?|socks[45]):\/\//i, '').split(/[\s,;]/)[0];
        const match = stripped.match(ipPortPattern);
        if (!match) continue;
        const port = parseInt(match[2], 10);
        if (port < 1 || port > 65535) continue;
        const proxy = `${match[1]}:${match[2]}`;
        if (/^socks5:\/\//i.test(line)) {
          result.socks5.push(proxy);
        } else if (/^socks4:\/\//i.test(line)) {
          result.socks4.push(proxy);
        } else if (/^https?:\/\//i.test(line)) {
          result.http.push(proxy);
        } else {
          logFn(`[~] (API) ${displayUrl}: skipping unknown-protocol line: ${line.slice(0, 50)}`);
        }
      }
      const total = result.http.length + result.socks4.length + result.socks5.length;
      logFn(`[+] (API) ${displayUrl}: ${total} proxies (http:${result.http.length} socks4:${result.socks4.length} socks5:${result.socks5.length})`);
      return total > 0 ? result : null;
    } catch (e) {
      logFn(`[!] (API) ${displayUrl} failed: ${e.message.slice(0, 60)}`);
      return null;
    }
  }

  /** 爬取 geonode.com 免费代理 */
  async _scrapeGeonode(logFn) {
    logFn(`[*] (Scrape) geonode.com...`);
    try {
      const response = await this.session.get('https://geonode.com/free-proxy-list/', {
        headers: { 'Accept': 'application/json, text/html', ...this.session.defaults.headers }
      });
      const $ = cheerio.load(response.data);
      const proxies = new Set();
      
      $('table tbody tr').each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length > 2) {
          const ip = $(cols[0]).text().trim();
          const port = $(cols[1]).text().trim();
          if (ip && port && /^\d+$/.test(port)) {
            proxies.add(`${ip}:${port}`);
          }
        }
      });

      const result = Array.from(proxies);
      logFn(`[+] (Scrape) geonode.com: ${result.length} proxies`);
      return result.length > 0 ? result : null;
    } catch (e) {
      logFn(`[!] (Scrape) geonode.com failed: ${e.message.slice(0, 50)}`);
      return null;
    }
  }

  /**
   * 获取所有来源的代理
   */
  async fetchAll(logFn, cancelFlag = { cancelled: false }) {
    const allProxies = { http: new Set(), socks4: new Set(), socks5: new Set() };
    const tasks = [];

    // 提交 API 源任务
    for (const [protocol, urls] of Object.entries(this.onlineSources)) {
      for (const url of urls) {
        if (cancelFlag.cancelled) break;
        tasks.push(
          this._fetchFromUrl(url, logFn).then(proxies => {
            if (proxies && allProxies[protocol]) {
              proxies.forEach(p => allProxies[protocol].add(p));
            }
          })
        );
      }
      if (cancelFlag.cancelled) break;
    }

    // 提交爬虫源任务
    if (!cancelFlag.cancelled) {
      for (const source of this.scrapingSources) {
        if (cancelFlag.cancelled) break;
        const protocol = source.protocol;
        tasks.push(
          source.func(logFn).then(proxies => {
            if (proxies && allProxies[protocol]) {
              proxies.forEach(p => allProxies[protocol].add(p));
            }
          }).catch(e => logFn(`[!] Scraper error: ${e.message.slice(0, 50)}`))
        );
      }
    }

    // 提交混合协议源任务
    if (!cancelFlag.cancelled) {
      for (const url of this.mixedSources) {
        if (cancelFlag.cancelled) break;
        tasks.push(
          this._fetchMixedSource(url, logFn).then(result => {
            if (result) {
              for (const [protocol, proxies] of Object.entries(result)) {
                if (allProxies[protocol]) {
                  proxies.forEach(p => allProxies[protocol].add(p));
                }
              }
            }
          })
        );
      }
    }

    await Promise.allSettled(tasks);

    return {
      http: Array.from(allProxies.http),
      socks4: Array.from(allProxies.socks4),
      socks5: Array.from(allProxies.socks5),
      total: Array.from(allProxies.http).length + 
             Array.from(allProxies.socks4).length + 
             Array.from(allProxies.socks5).length
    };
  }
}

module.exports = ProxyFetcher;
