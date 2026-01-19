// public/sw.js
self.addEventListener('install', (p) => {
  console.log('서비스 워커 설치 완료!');
  self.skipWaiting();
});

self.addEventListener('activate', (p) => {
  console.log('서비스 워커 활성화!');
});

self.addEventListener('fetch', (p) => {
  // 요청 가로채기 (오프라인 지원을 위해 필요하지만 지금은 비워둡니다)
});