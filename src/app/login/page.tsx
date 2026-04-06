'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createUserProfile, joinFamilyWithCode } from '@/lib/family-utils'
import { FamilySetupModal } from '@/components/FamilySetupModal'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { refreshFamilyInfo } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFamilySetup, setShowFamilySetup] = useState(false)
  const [newUserId, setNewUserId] = useState<string | null>(null)
  const [newUserDisplayName, setNewUserDisplayName] = useState('')
  const [inviteCodeFromLink, setInviteCodeFromLink] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const inviteCode = new URLSearchParams(window.location.search)
        .get('inviteCode')
        ?.trim()
        .toUpperCase()
      setInviteCodeFromLink(inviteCode || null)
    }

    const script = document.createElement('script')
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.Kakao) {
        const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
        if (kakaoKey && !window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoKey)
          console.log('Kakao SDK initialized with key:', kakaoKey.substring(0, 8) + '...')
        } else if (!kakaoKey) {
          console.error('NEXT_PUBLIC_KAKAO_JS_KEY is not set')
        }
      }
    }

    script.onerror = () => {
      console.error('Failed to load Kakao SDK')
      setError('Kakao SDK를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }, [])

  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      setError('Kakao SDK를 로드할 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    if (!window.Kakao.isInitialized()) {
      setError('Kakao SDK가 초기화되지 않았습니다.')
      return
    }

    setLoading(true)
    setError('')

    window.Kakao.Auth.login({
      scope: 'profile_nickname',
      success: async () => {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async (response: any) => {
            const kakaoId = response.id
            const nickname =
              response.kakao_account?.profile?.nickname ||
              response.properties?.nickname ||
              'User'
            const profileImage =
              response.kakao_account?.profile?.profile_image_url ||
              response.properties?.profile_image ||
              undefined

            try {
              const email = `kakao_${kakaoId}@kakao.local`
              const password = `kakao_${kakaoId}`

              const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    provider: 'kakao',
                    kakao_id: kakaoId,
                    display_name: nickname,
                  },
                },
              })

              if (
                signUpError &&
                !signUpError.message.toLowerCase().includes('already registered')
              ) {
                throw signUpError
              }

              const { data: loginData, error: loginError } =
                await supabase.auth.signInWithPassword({
                  email,
                  password,
                })

              if (loginError) {
                throw loginError
              }

              const user = loginData.session?.user
              if (!user) throw new Error('로그인 실패')

              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle()

              if (!existingProfile) {
                await createUserProfile(user.id, nickname, profileImage)
              }

              const inviteCodeFromLink = new URLSearchParams(window.location.search)
                .get('inviteCode')
                ?.trim()
                .toUpperCase()

              const { data: familyMember } = await supabase
                .from('family_members')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle()

              if (familyMember) {
                await refreshFamilyInfo()
                router.push('/minutes')
                router.refresh()
              } else if (inviteCodeFromLink) {
                await joinFamilyWithCode(inviteCodeFromLink, user.id)
                await refreshFamilyInfo()
                router.push('/minutes')
                router.refresh()
              } else {
                setNewUserId(user.id)
                setNewUserDisplayName(nickname)
                setShowFamilySetup(true)
              }
            } catch (err) {
              console.error('Kakao/Supabase login error:', err)
              setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
            } finally {
              setLoading(false)
            }
          },
          fail: (apiError: any) => {
            console.error('Kakao user info request failed:', apiError)
            setError('Kakao 사용자 정보를 가져오지 못했습니다.')
            setLoading(false)
          },
        })
      },
      fail: (loginError: any) => {
        console.error('Kakao login failed:', loginError)
        setError('Kakao 로그인이 취소되었거나 실패했습니다.')
        setLoading(false)
      },
    })
  }

  const handleFamilySetupComplete = async () => {
    await refreshFamilyInfo()
    setShowFamilySetup(false)
    router.push('/minutes')
    router.refresh()
  }

  return (
    <>
      {showFamilySetup && newUserId && (
        <FamilySetupModal
          userId={newUserId}
          displayName={newUserDisplayName}
          onSuccess={handleFamilySetupComplete}
        />
      )}

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 text-3xl mb-2">
              🏠 우리 가족 회의
            </h1>
            <p className="text-slate-500 text-sm">카카오 계정으로 회의록 앱에 로그인하세요</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full py-3 mb-4 bg-yellow-300 text-slate-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>☕</span>
            {loading ? 'Kakao 로그인 중...' : 'Kakao로 로그인'}
          </button>

          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                console.log('Kakao SDK loaded:', !!window.Kakao)
                console.log('Kakao initialized:', window.Kakao?.isInitialized?.())
                console.log('Kakao key:', process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.substring(0, 8) + '...')
                alert(`Kakao SDK: ${!!window.Kakao}\nInitialized: ${window.Kakao?.isInitialized?.()}\nKey: ${process.env.NEXT_PUBLIC_KAKAO_JS_KEY ? 'Set' : 'Not set'}`)
              }}
              className="w-full py-2 mb-4 bg-gray-300 text-slate-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors text-sm"
            >
              🔧 Kakao SDK 상태 확인 (개발용)
            </button>
          )}

          <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-3 text-xs text-yellow-800 leading-5">
            {inviteCodeFromLink
              ? `초대 링크가 확인되었습니다. 로그인 후 가족코드 ${inviteCodeFromLink}가 자동으로 연결됩니다.`
              : '처음에 사용하시던 Kakao 로그인 흐름으로 복구했습니다. 가족별 회의록 접근 제어는 그대로 유지됩니다.'}
          </div>
        </div>
      </div>
    </>
  )
}
