import './globals.css'
import Link from 'next/link'
import type { Metadata, Viewport } from 'next'
import PWARegister from './pwa-register'
import { AuthProvider } from '@/lib/auth-context'
import { UserMenu } from '@/components/UserMenu'

// 1. Viewport 설정: 모바일 기기에서 앱처럼 보이도록 최적화
export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 2. Metadata 설정: PWA 매니페스트 및 아이콘 연결
export const metadata: Metadata = {
  title: '우리 가족 회의',
  description: '햄볶는 우리 가족을 위한 회의록 앱',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#F8F9FA] text-[#343A40] min-h-screen antialiased">
        <AuthProvider>
          {/* 상단 헤더: max-w-md로 모바일 뷰 고정 및 중앙 정렬 */}
          <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-14 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-5 z-50">
            <Link href="/">
              <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 text-lg tracking-tight">
                🏠 우리 가족 회의
              </h1>
            </Link>
            <UserMenu />
          </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="pt-14 pb-24 max-w-md mx-auto min-h-screen bg-white shadow-sm ring-1 ring-slate-100">
          <div className="p-5">
            {children}
          </div>
        </main>

        {/* 하단 네비게이션 바 */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-lg border-t border-slate-100 flex justify-around items-center h-20 px-6 z-50">
          <Link href="/minutes" className="flex flex-col items-center gap-1.5 group flex-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center group-active:scale-95 transition-all text-xl">
              📝
            </div>
            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-indigo-600">회의록</span>
          </Link>
          
          <Link href="/calendar" className="flex flex-col items-center gap-1.5 group flex-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center group-active:scale-95 transition-all text-xl">
              📅
            </div>
            <span className="text-[11px] font-semibold text-slate-500 group-hover:text-purple-600">달력</span>
          </Link>
        </nav>
          <PWARegister />
          
          {/* 🚀 서비스 워커(sw.js) 등록 스크립트
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(reg) {
                        console.log('서비스 워커 등록 성공:', reg.scope);
                      })
                      .catch(function(err) {
                        console.log('서비스 워커 등록 실패:', err);
                      });
                  });
                }
              `,
            }}
          /> */}
        </AuthProvider>
      </body>
    </html>
  )
}