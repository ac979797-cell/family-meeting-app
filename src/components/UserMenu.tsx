'use client'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        로그인
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center hover:bg-indigo-200 transition-colors"
        title={user.email || 'User'}
      >
        {(user.email || 'U')[0].toUpperCase()}
      </button>

      {isOpen && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 드롭다운 메뉴 */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={async () => {
                await signOut()
                setIsOpen(false)
                router.push('/login')
              }}
              className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  )
}
