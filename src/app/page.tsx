'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="p-4 pb-24">
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          🏠 우리 가족 회의
        </h1>
        <p className="text-slate-600 mb-8">
          가족 회의를 위한 스마트한 회의록 관리 앱
        </p>

        <div className="grid gap-4 max-w-sm mx-auto">
          <Link
            href="/minutes"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow"
          >
            📝 회의록 보기
          </Link>

          <Link
            href="/minutes/new"
            className="bg-white text-indigo-600 py-4 px-6 rounded-2xl font-bold shadow-lg border-2 border-indigo-200 hover:bg-indigo-50 transition-colors"
          >
            ➕ 새 회의록 작성
          </Link>

          <Link
            href="/calendar"
            className="bg-purple-500 text-white py-4 px-6 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-shadow"
          >
            📅 캘린더 보기
          </Link>
        </div>
      </div>
    </div>
  )
}