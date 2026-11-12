/**
 * 全站 SEO 与 Meta 规范化更新工具
 * 确保客户端路由切换时，document.title、description、og 元数据与 link[rel="canonical"] 正确同步，
 * 杜绝 Canonical 被浏览器或爬虫错误回退至首页的缺陷。
 */

export interface PageSeoOptions {
  title: string;
  description: string;
  path?: string;
  ogType?: 'website' | 'article';
}

export function setPageSeo({
  title,
  description,
  path = '',
  ogType = 'website',
}: PageSeoOptions): void {
  if (typeof document === 'undefined') return;

  // 1. 设置 document.title
  document.title = title;

  // 2. 规范化规范链接 Canonical
  const siteUrl = (
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://softtribe.top')
  ).replace(/\/$/, '');

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${siteUrl}${normalizedPath === '/' ? '' : normalizedPath}`;

  const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. 设置常用 Meta 描述与 OpenGraph
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', ogType);
  upsertMeta('property', 'og:url', canonicalUrl);

  // 4. 设置 Canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);
}
