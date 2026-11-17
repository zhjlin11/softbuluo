// 软游部落 PWA 核心 Service Worker (P9.1.1 根治假离线与导航放行稳定版)
const CACHE_NAME = 'softtribe-pwa-v1.5.0';
const OFFLINE_URL = '/offline.html';

// 严格白名单：仅预缓存公开无隐私的静态基础资产
const PRECACHE_WHITELIST = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/logo/Logo.png',
];

/**
 * 带有微重试机制的 fetch
 * 解决国内大陆服务器在科学上网代理切换、DNS 短暂抖动或微小丢包时的假离线问题
 */
async function fetchWithRetry(request, retries = 2, delay = 350) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(request);
      // 如果服务器返回 502/503/504，可能是 PM2 平滑热重载瞬间，短暂等待后重试一次
      if (
        (response.status === 502 || response.status === 503 || response.status === 504) &&
        i < retries
      ) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/**
 * 严格私有路径黑名单
 * 任何匹配私有路径的请求，SW 绝对不读取缓存、绝不写入缓存、绝不存储响应
 */
function isStrictlyPrivate(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    // 1. API 接口响应绝对不经 SW 缓存 (保障数据实时性与 Session 安全)
    if (path.startsWith('/api/')) return true;

    // 2. 任何私有业务路由绝对禁止缓存
    const privatePrefixes = [
      '/admin',
      '/account',
      '/member',
      '/membership',
      '/orders',
      '/refunds',
      '/checkout',
      '/developer/api-keys',
      '/developer/dashboard',
      '/login',
      '/register',
      '/auth',
    ];

    return privatePrefixes.some((prefix) => path.startsWith(prefix));
  } catch {
    return true; // 解析异常一律按私有安全拦截
  }
}

/**
 * 严格静态资产白名单
 * 仅允许可安全公开缓存的静态构建产物 (JS/CSS/图片/字体)
 */
function isWhitelistedAsset(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    // 排除私有路径
    if (isStrictlyPrivate(url)) return false;

    // 允许明确的静态公共资源
    if (PRECACHE_WHITELIST.includes(path)) return true;
    if (
      path.startsWith('/assets/') ||
      path.startsWith('/logo/') ||
      path.startsWith('/screenshots/')
    ) {
      return true;
    }

    // 允许哈希静态文件扩展名
    return /\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2|woff|ttf)$/i.test(path);
  } catch {
    return false;
  }
}

// 1. 安装阶段仅预缓存白名单公共资产
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_WHITELIST);
    })
  );
  self.skipWaiting();
});

// 2. 激活阶段清理所有历史旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] 清理过期缓存版本:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 请求拦截与安全多维策略
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 严格安全守则 1: 非 GET 请求直接放行
  if (req.method !== 'GET') {
    return;
  }

  // 严格安全守则 2: 私有路径与私有 API 绝对不拦截、不缓存、直连网络
  if (isStrictlyPrivate(req.url)) {
    return;
  }

  // 严格安全守则 3: 页面导航请求 (req.mode === 'navigate'，如打开网页、刷新、地址栏输入、外链进入)
  // 坚决放行！完全交由浏览器底层原生网络栈与 Nginx 处理，绝对不拦截、不篡改、绝不强行展示离线页！
  // 彻底根治科学上网代理切换、DNS 抖动、跨国握手超时导致的“假离线”拦截与死锁问题
  if (req.mode === 'navigate') {
    return;
  }

  // 严格安全守则 4: 仅对符合白名单的公开静态资源执行 Stale-While-Revalidate
  if (isWhitelistedAsset(req.url)) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            // 验证响应安全合规：无 Set-Cookie、200 OK 且非私有
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              !networkResponse.headers.has('Set-Cookie')
            ) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // 如果本地已有有效静态缓存则立即可用，后台并行发起静默重新校验
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 其他所有未知请求一律保持网络直通
});
