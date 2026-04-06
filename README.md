<h2 align="center">ProxyPulse</h2>
<p align="center">
  <strong>高可用免费代理池管理器</strong><br>
  <em>[Node.js Edition] · 一键启动 · 无需 Python · One-click Start, No Python Needed</em>
</p>

---

## 🖥️ Preview | 预览

![ProxyPulse Screenshot](images/01.png)

---

## ✨ Features | 功能特性

- **30+ 代理数据源 / Proxy Sources** — 公开 API + 爬虫站点全覆盖
- **多协议支持 / Multi-Protocol** — HTTP / SOCKS4 / SOCKS5
- **智能验证 / Smart Validation** — TCP 预检 → 延迟测试 → 匿名度检测 → 速度测速 → 地理位置
- **IP 轮换 / IP Rotation** — 手动 Manual / 自动 Auto / 逐请求 Per-Request 三种模式
- **本地代理服务 / Local Proxy Server** — `HTTP:1801` + `SOCKS5:1800`
- **Web GUI** — 暗色/亮色主题 Dark/Light Theme + 中英双语 i18n + 实时渲染 Real-time Rendering
- **一键启动 / One-click Start** — `npm start` 即可运行
- **数据持久化 / Data Persistence** — 代理池与配置持久化，重启不丢数据

## 🚀 Quick Start | 快速开始

### Node.js

```bash
# Clone or download | 克隆或下载本项目
git clone https://github.com/Vogadero/proxy-pulse.git
cd proxy-pulse

# Install dependencies | 安装依赖
npm install

# Start! | 启动服务
npm start
```

### 🐳 Docker

```bash
docker run -d \
  --name proxy-pulse \
  -p 127.0.0.1:3456:3456 \
  -p 127.0.0.1:1800:1800 \
  -p 127.0.0.1:1801:1801 \
  -e TZ=Asia/Shanghai \
  -v proxy-pulse-data:/data \
  --restart unless-stopped \
  ghcr.io/mr-xn/proxy-pulse:latest
```

> 可通过 `-e TZ=Asia/Shanghai` 参数修改容器内时区，默认为 `Asia/Shanghai`。  
> Use `-e TZ=<timezone>` to set the container timezone (e.g. `-e TZ=UTC`).
>
> `-v proxy-pulse-data:/data` 将代理池和配置文件持久化到 Docker 命名卷，容器升级重建后数据不丢失。  
> `-v proxy-pulse-data:/data` mounts a named volume at `/data` so proxy pool and settings survive container upgrades.

### 🐳 Docker Compose

```yaml
services:
  proxy-pulse:
    image: ghcr.io/mr-xn/proxy-pulse:latest
    container_name: proxy-pulse
    ports:
      - target: 3456
        published: 3456
        host_ip: 127.0.0.1
      - target: 1800
        published: 1800
        host_ip: 127.0.0.1
      - target: 1801
        published: 1801
        host_ip: 127.0.0.1
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - proxy-pulse-data:/data
    restart: unless-stopped

volumes:
  proxy-pulse-data:
```

```bash
docker compose up -d
```

Open [http://localhost:3456](http://localhost:3456) in your browser. | 浏览器打开即可使用。

> 也可以用宿主机目录代替命名卷实现挂载，例如：  
> You can also bind-mount a host directory instead of a named volume:
> ```bash
> -v /your/host/path:/data
> ```

### Ports | 端口说明

| Service | Port | Description |
|---------|------|-------------|
| Web GUI | `3456` | Management Interface / 管理界面 |
| HTTP Proxy | `1801` | Local HTTP Proxy / 本地 HTTP 代理 |
| SOCKS5 Proxy | `1800` | Local SOCKS5 Proxy / 本地 SOCKS5 代理 |

---

## 💾 Data Persistence | 数据持久化

程序运行时会在数据目录下写入以下文件：

| 文件 | 说明 |
|------|------|
| `pool.json` | 代理池快照（代理列表 + 排除列表） |
| `config.json` | 应用设置（验证线程数、Web 认证、代理认证等） |

**数据目录**由环境变量 `DATA_DIR` 指定：

| 运行方式 | 默认数据目录 |
|----------|------------|
| Node.js 直接运行 | 项目根目录（`app.js` 所在位置） |
| Docker / Docker Compose | `/data`（需挂载持久化卷） |

Docker 中挂载卷后，升级镜像或重建容器不会丢失代理池和设置。  
When running in Docker, mount a volume to `/data` to keep proxy pool and settings across container upgrades.

---

## 📖 Usage Guide | 使用指南

1. Click **"Fetch Proxies" / 获取代理** — Scrape and validate free proxies from 30+ sources
2. Wait for validation (TCP pre-check → full quality test), proxies render in real-time
3. Click **"Start Service / 启动服务"** — Enable the local proxy server
4. Set browser/software proxy to `127.0.0.1:1801` (HTTP) or `127.0.0.1:1800` (SOCKS5)
5. Use **"Rotate IP / 换IP"** or **"Auto / 自动"** mode to switch proxy IPs

### Toolbar Functions | 工具栏功能

| Button | 功能 | Description |
|--------|------|-------------|
| Fetch / Cancel | 获取代理 / 取消任务 | Scrape & validate proxies, supports cancellation |
| Clear | 清空列表 | Clear current proxy pool |
| Import | 导入 | Import custom proxy list from text |
| Re-test All | 全部重测 | Re-validate existing proxies |
| Export | 导出代理 | Export working proxies to file |
| Rotate IP | 换IP | Manually switch to next available proxy |
| Auto | 自动 | Enable auto-rotation mode (configurable interval) |

---

## 🔐 Web GUI Authentication | Web 界面认证

Web 管理界面支持密码保护，防止未授权访问。默认不启用，设置密码后自动生效。  
The Web GUI supports optional password protection. It is disabled by default and activates once a password is set.

### 设置密码 / Set Password

首次启动后，通过以下 API 设置密码（密码至少 6 位）：  
After first startup, set a password via the API (minimum 6 characters):

```bash
curl -X POST http://localhost:3456/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"password": "yourpassword"}'
```

密码设置后，所有 `/api/*` 接口（除登录/登出）均需登录后才能访问。  
After setting the password, all `/api/*` endpoints (except login/logout) require authentication.

### 登录 / Login

```bash
curl -X POST http://localhost:3456/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "yourpassword"}' \
  -c cookies.txt
```

登录成功后会返回 `Set-Cookie: auth_token=...`，后续请求携带该 Cookie 即可。  
On success a `Set-Cookie: auth_token=...` header is returned; include it in subsequent requests.

### 修改密码 / Change Password

```bash
curl -X POST http://localhost:3456/api/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"currentPassword": "oldpass", "newPassword": "newpass"}'
```

### 登出 / Logout

```bash
curl -X POST http://localhost:3456/api/auth/logout -b cookies.txt
```

### Web 认证 API 一览 / Auth API Reference

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/auth/status` | 查询认证状态（是否已设置密码、当前是否已登录） |
| `POST` | `/api/auth/setup` | 首次设置密码 `{ "password": "..." }` |
| `POST` | `/api/auth/login` | 登录 `{ "password": "..." }` |
| `POST` | `/api/auth/logout` | 登出，清除 Cookie |
| `POST` | `/api/auth/change-password` | 修改密码 `{ "currentPassword": "...", "newPassword": "..." }` |

> 登录接口有频率限制：15 分钟内最多尝试 10 次，超限后需等待窗口重置。  
> Login endpoints are rate-limited: max 10 attempts per 15-minute window per IP.

---

## 🔑 Local Proxy Authentication | 本地代理认证

本地 HTTP / SOCKS5 代理服务支持用户名/密码认证，防止局域网内未授权使用。  
The local HTTP/SOCKS5 proxy server supports username/password authentication to restrict access.

### 启用代理认证 / Enable Proxy Auth

在 Web 界面 **Settings / 设置** 页面中，开启 **Proxy Auth / 代理认证** 并填写用户名和密码后保存即可。  
也可以通过 API 直接设置：  
You can also configure it via the API:

```bash
curl -X POST http://localhost:3456/api/settings/save \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "settings": {
      "proxyAuth": {
        "enabled": true,
        "username": "proxyuser",
        "password": "proxypassword"
      }
    }
  }'
```

> `username` 默认为 `proxy`。密码在服务端以 scrypt 哈希存储，不保存明文。  
> Default username is `proxy`. Passwords are stored as scrypt hashes; plaintext is never saved.

### 使用带认证的代理 / Using Authenticated Proxy

```bash
# HTTP 代理
curl -x http://proxyuser:proxypassword@127.0.0.1:1801 https://example.com

# SOCKS5 代理
curl --socks5 127.0.0.1:1800 -U proxyuser:proxypassword https://example.com
```

### 禁用代理认证 / Disable Proxy Auth

```bash
curl -X POST http://localhost:3456/api/settings/save \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"settings": {"proxyAuth": {"enabled": false}}}'
```

---

## 🏗️ Project Structure | 项目结构

```
proxy-pulse/
├── app.js              # Express API server (port 3456)
├── public/
│   ├── index.html      # Web GUI page
│   ├── app.js          # Frontend logic (i18n, animations, real-time rendering)
│   └── style.css       # Stylesheet (CSS variables theme system)
├── modules/
│   ├── fetcher.js      # 30+ source scraper (API + cheerio crawler)
│   ├── checker.js      # TCP pre-check + latency/anonymity/speed/location detection
│   ├── rotator.js      # IP rotation manager with smart scoring
│   └── server.js       # Local proxy server HTTP(1801) + SOCKS5(1800)
├── images/             # Screenshots / 截图
├── .gitignore          # Git ignore rules
└── package.json        # Project configuration
```

> 运行时数据文件（`pool.json`、`config.json`、`temp/`）写入 `DATA_DIR` 指定的目录，不在项目源码目录中（Docker 环境下为 `/data`）。  
> Runtime data files (`pool.json`, `config.json`, `temp/`) are written to the directory specified by `DATA_DIR` (defaults to `/data` in Docker).

---

## 🎨 UI Features | 界面特性

- **Dark / Light Theme / 暗色/亮色主题** — One-click toggle, auto-save preference
- **Bilingual / 中英双语** — Chinese / English switching
- **Real-time Rendering / 实时渲染** — Proxy list updates row-by-row during validation, no waiting for completion
- **Live Log / 实时日志** — Right panel shows validation progress and results in real-time
- **Stats Animation / 统计动画** — Available/Total count updates with dynamic effects
- **Responsive Toolbar / 响应式工具栏** — Buttons auto-adapt to different screen widths

---

## ⚠️ Disclaimer | 免责声明

Free proxies are unstable by nature. Do NOT use them for:
- 免费代理本质上不稳定，请勿用于：
- Transmitting sensitive data (passwords, tokens, banking info) / 传输敏感数据（密码、Token、银行信息等）
- Production-critical applications / 生产环境或关键业务

For production use, consider paid commercial proxy services.
生产环境建议使用付费商业代理服务。

---

## License

[MIT](LICENSE) | © Vogadero
