'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createUserProfile } from '@/lib/family-utils'
import { FamilySetupModal } from '@/components/FamilySetupModal'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFamilySetup, setShowFamilySetup] = useState(false)
  const [newUserId, setNewUserId] = useState<string | null>(null)
  const [newUserDisplayName, setNewUserDisplayName] = useState('')

  useEffect(() => {
    // Kakao SDK 로드
    const script = document.createElement('script')
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.Kakao) {
        const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
        if (kakaoKey) {
          window.Kakao.init(kakaoKey)
          console.log('Kakao SDK initialized with key:', kakaoKey.substring(0, 8) + '...')
        } else {
          console.error('NEXT_PUBLIC_KAKAO_JS_KEY is not set')
        }
      }
    }

    script.onerror = () => {
      console.error('Failed to load Kakao SDK')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // 로그인 성공
      router.push('/minutes')
    } catch (err) {
      setError('로그인에 실패했습니다.')
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setError('')
    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      setError('')
      alert('회원가입 확인 이메일을 보냈습니다. 이메일을 확인해주세요.')
      setLoading(false)
    } catch (err) {
      setError('회원가입에 실패했습니다.')
      setLoading(false)
    }
  }

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

    console.log('Starting Kakao login...')

    window.Kakao.Auth.login({
      success: async (authObj: any) => {
        console.log('Kakao auth success:', authObj)
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async (response: any) => {
            console.log('Kakao user info:', response)
            const kakaoId = response.id
            const nickname = response.kakao_account?.profile?.nickname || 'User'
            const profileImage = response.kakao_account?.profile?.profile_image_url

            try {
              // Supabase에서 ID/PW sign up (Kakao ID 기반)
              const { data: signUpData, error: signUpError } =
                await supabase.auth.signUp({
                  email: `kakao_${kakaoId}@kakao.local`,
                  password: `kakao_${kakaoId}`, // 내부 용도 비밀번호
                  options: {
                    data: {
                      provider: 'kakao',
                      kakao_id: kakaoId,
                      display_name: nickname,
                    },
                  },
                })

              if (signUpError && signUpError.message !== 'User already registered') {
                console.error('Supabase signup error:', signUpError)
                throw signUpError
              }

              // 로그인 수행
              const { data: loginData, error: loginError } =
                await supabase.auth.signInWithPassword({
                  email: `kakao_${kakaoId}@kakao.local`,
                  password: `kakao_${kakaoId}`,
                })

              if (loginError) {
                console.error('Supabase login error:', loginError)
                throw loginError
              }

              const user = loginData.session?.user
              if (!user) throw new Error('로그인 실패')

              console.log('Supabase login success:', user.id)

              // 프로필 생성 (첫 로그인인 경우)
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single()

              if (!existingProfile) {
                console.log('Creating user profile...')
                await createUserProfile(user.id, nickname, profileImage)
              }

              // 가족 그룹 확인
              const { data: familyMember } = await supabase
                .from('family_members')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)
                .single()

              if (familyMember) {
                // 이미 가족에 속함
                console.log('User already in family, redirecting to minutes')
                router.push('/minutes')
              } else {
                // 가족 설정 필요
                console.log('User needs family setup')
                setNewUserId(user.id)
                setNewUserDisplayName(nickname)
                setShowFamilySetup(true)
              }

              setLoading(false)
            } catch (err) {
              console.error('Supabase error:', err)
              setError(
                err instanceof Error ? err.message : 'Supabase 로그인 실패'
              )
              setLoading(false)
            }
          },
          fail: (error: any) => {
            console.error('Kakao user info request failed:', error)
            setError('Kakao 사용자 정보를 가져올 수 없습니다.')
            setLoading(false)
          },
        })
      },
      fail: (error: any) => {
        console.error('Kakao login failed:', error)
        setError('Kakao 로그인이 취소되었습니다.')
        setLoading(false)
      },
    })
  }

  const handleFamilySetupComplete = () => {
    setShowFamilySetup(false)
    router.push('/minutes')
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
          {/* 로고 */}
          <div className="text-center mb-8">
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 text-3xl mb-2">
              🏠 우리 가족 회의
            </h1>
            <p className="text-slate-500 text-sm">회의록 앱에 로그인하세요</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Kakao 로그인 */}
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full py-3 mb-4 bg-yellow-300 text-slate-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>☕</span>
            {loading ? 'Kakao 로그인 중...' : 'Kakao로 로그인'}
          </button>

          {/* 디버깅 버튼 (개발용) */}
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

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-slate-300"></div>
            <span className="text-xs text-slate-500">또는</span>
            <div className="flex-1 border-t border-slate-300"></div>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 회원가입 */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-slate-600 text-sm mb-3">
              계정이 없으신가요?
            </p>
            <button
              onClick={handleSignUp}
              disabled={loading || !email || !password}
              className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '진행 중...' : '회원가입'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
