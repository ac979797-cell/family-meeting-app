import './globals.css'
import Link from 'next/link'
// Viewport 타입을 추가로 임포트해야 합니다.
import type { Metadata, Viewport } from 'next'

// 1. viewport 설정 (색상 및 모바일 최적화)
export const viewport: Viewport = {
  themeColor: '#ffffff', // 앱 바 상단 색상 (흰색 배경에 맞춰 수정 추천)
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // PWA처럼 보이게 하기 위해 줌 제한 (선택사항)
};

// 2. metadata 설정
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
        {/* 상단 헤더: 블러 효과와 중앙 정렬 */}
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-14 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-center z-50">
          <Link href="/minutes">
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 text-lg tracking-tight">
              🏠 우리 가족 회의
            </h1>
          </Link>
        </header>

        {/* 메인 컨텐츠: 카드 레이아웃 스타일 */}
        {/* max-w-md와 mx-auto를 통해 모바일 뷰포트 고정 */}
        <main className="pt-14 pb-24 max-w-md mx-auto min-h-screen bg-white shadow-sm ring-1 ring-slate-100">
          <div className="p-5">
            {children}
          </div>
        </main>

        {/* 하단 네비게이션 */}
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
      </body>
    </html>
  )
}