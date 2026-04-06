'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace('/login')
    }, 800)

    return () => window.clearTimeout(timer)
  }, [router])

  return (
    <div className="p-6 text-center text-slate-600">
      사용 중인 Kakao 로그인은 팝업 방식입니다.<br />
      로그인 페이지로 이동 중입니다...
    </div>
  )
}