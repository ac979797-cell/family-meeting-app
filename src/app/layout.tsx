import './globals.css'
import Link from 'next/link'
// src/app/layout.tsx 상단에 추가
export const metadata = {
  title: "우리 가족 회의",
  description: "포근한 가족 소통 공간",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#F8F9FA] text-[#343A40] min-h-screen antialiased">
        {/* 상단 헤더: 블러 효과와 부드러운 테두리 */}
        <header className="fixed top-0 left-0 right-0 h-14 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-center z-50">
          <Link href="/minutes">
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 text-lg tracking-tight">
              🏠 우리 가족 회의
            </h1>
          </Link>
        </header>

        {/* 메인 컨텐츠: 카드 레이아웃 스타일 */}
        <main className="pt-14 pb-24 max-w-md mx-auto min-h-screen bg-white shadow-sm ring-1 ring-slate-100">
          <div className="p-5">
            {children}
          </div>
        </main>

        {/* 하단 네비게이션: 아이콘 중심의 세련된 디자인 */}
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