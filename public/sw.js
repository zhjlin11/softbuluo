// 软游部落 PWA 核心 Service Worker (P8.7 生产安全与全站独立栏目加固版)
const CACHE_NAME = 'softtribe-pwa-v1.3.0';
const OFFLINE_URL = '/offline.html';

// 严格白名单：仅预缓存公开无隐私的静态基础资产
const PRECACHE_WHITELIST = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/logo/Logo.png'
];

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
      '/auth'
    ];

    return privatePrefixes.some(prefix => path.startsWith(prefix));
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
    if (path.startsWith('/assets/') || path.startsWith('/logo/') || path.startsWith('/screenshots/')) {
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
    // 若属于私有导航请求遇到断网，直接返回离线兜底，杜绝展示上一位用户的缓存数据
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req).catch(async () => {
          const offlinePage = await caches.match(OFFLINE_URL);
          return offlinePage || new Response('Network offline', { status: 503 });
        })
      );
    }
    return;
  }

  // 严格安全守则 3: 公开导航请求 (如首页、分类、公开详情页)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const offlinePage = await caches.match(OFFLINE_URL);
        return offlinePage || new Response('Network offline', { status: 503 });
      })
    );
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

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// 4. 监听来自客户端的消息 (支持平滑更新与登出强制清理缓存)
self.addEventListener('message', (event) => {
  if (event.data) {
    if (event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
    // 当会员或管理员退出登录时，安全清除所有运行时缓存
    if (event.data.type === 'PURGE_USER_DATA') {
      caches.keys().then((keys) => {
        keys.forEach((k) => caches.delete(k));
      });
    }
  }
});
