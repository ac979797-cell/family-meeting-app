'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    // 브라우저 환경이고 서비스 워커를 지원하는지 확인
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('서비스 워커 등록 성공:', registration.scope);
        } catch (error) {
          console.error('서비스 워커 등록 실패:', error);
        }
      };

      registerServiceWorker();
    }
  }, []);

  return null; // 화면에 아무것도 그리지 않음
}