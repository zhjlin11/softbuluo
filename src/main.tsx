import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 注册 PWA Service Worker (严格隔离敏感管理路由与订单数据)
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('✅ 软游部落 PWA Service Worker 注册成功:', reg.scope);
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('⚡ 发现新版本软游部落前端资产，支持平滑热更新');
            }
          };
        }
      };
    }).catch((err) => {
      console.warn('PWA Service Worker 注册失败:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
