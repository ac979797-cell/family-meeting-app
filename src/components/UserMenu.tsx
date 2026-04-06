'use client'
import { FamilySetupModal } from '@/components/FamilySetupModal'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

export function UserMenu() {
  const {
    user,
    familyId,
    familyName,
    inviteCode,
    displayName,
    refreshFamilyInfo,
    signOut,
  } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showFamilyModal, setShowFamilyModal] = useState(false)
  const [notice, setNotice] = useState('')

  const inviteMessage = useMemo(() => {
    const loginUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/login${inviteCode ? `?inviteCode=${encodeURIComponent(inviteCode)}` : ''}`
        : ''
    return `${familyName || '우리 가족'} 초대 링크\n${loginUrl}\n초대 코드: ${inviteCode || '-'}`
  }, [familyName, inviteCode])

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

  const ensureKakaoSdk = async () => {
    if (typeof window === 'undefined') return

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY
    if (!kakaoKey) {
      throw new Error('Kakao JavaScript 키가 설정되지 않았습니다.')
    }

    if (window.Kakao?.isInitialized?.()) {
      return
    }

    await new Promise<void>((resolve, reject) => {
      const init = () => {
        try {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(kakaoKey)
          }
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      const existingScript = document.querySelector('script[data-kakao-sdk="true"]') as HTMLScriptElement | null
      if (existingScript) {
        if (window.Kakao) {
          init()
        } else {
          existingScript.addEventListener('load', init, { once: true })
          existingScript.addEventListener('error', () => reject(new Error('Kakao SDK 로드 실패')), { once: true })
        }
        return
      }

      const script = document.createElement('script')
      script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js'
      script.async = true
      script.dataset.kakaoSdk = 'true'
      script.onload = init
      script.onerror = () => reject(new Error('Kakao SDK 로드 실패'))
      document.body.appendChild(script)
    })
  }

  const handleCopyCode = async () => {
    if (!inviteCode) {
      setNotice('먼저 가족 그룹을 생성하거나 참여해주세요.')
      return
    }

    await navigator.clipboard.writeText(inviteCode)
    setNotice('가족 코드가 복사되었습니다.')
  }

  const handleShareKakao = async () => {
    if (!inviteCode) {
      setNotice('먼저 가족 그룹을 생성해주세요.')
      setShowFamilyModal(true)
      return
    }

    try {
      await ensureKakaoSdk()

      const inviteLink = `${window.location.origin}/login?inviteCode=${encodeURIComponent(inviteCode)}`

      const payload = {
        objectType: 'feed',
        content: {
          title: '🏠 우리 가족 회의 초대',
          description: `${familyName || '우리 가족'} 초대 링크입니다. 로그인하면 자동으로 가족에 연결돼요!`,
          imageUrl: `${window.location.origin}/icon.png`,
          link: {
            mobileWebUrl: inviteLink,
            webUrl: inviteLink,
          },
        },
        buttons: [
          {
            title: '초대 링크 열기',
            link: {
              mobileWebUrl: inviteLink,
              webUrl: inviteLink,
            },
          },
        ],
      }

      if (window.Kakao.Share?.sendDefault) {
        window.Kakao.Share.sendDefault(payload)
      } else if (window.Kakao.Link?.sendDefault) {
        window.Kakao.Link.sendDefault(payload)
      } else {
        throw new Error('Kakao 공유 기능을 사용할 수 없습니다.')
      }
    } catch (error) {
      await navigator.clipboard.writeText(inviteMessage)
      setNotice('카카오 공유 대신 초대 문구를 클립보드에 복사했습니다.')
    }
  }

  return (
    <>
      {showFamilyModal && (
        <FamilySetupModal
          userId={user.id}
          displayName={displayName || user.email?.split('@')[0] || '가족 구성원'}
          onSuccess={async () => {
            await refreshFamilyInfo()
            setShowFamilyModal(false)
            setIsOpen(false)
            setNotice('가족 코드가 준비되었습니다.')
            router.refresh()
          }}
        />
      )}

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center hover:bg-indigo-200 transition-colors"
          title={displayName || user.email || 'User'}
        >
          {(displayName || user.email || 'U')[0].toUpperCase()}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {displayName || user.email}
                </p>
                {familyName && (
                  <p className="text-xs text-slate-500 mt-1">현재 가족: {familyName}</p>
                )}
              </div>

              {notice && (
                <div className="px-4 py-2 text-xs text-indigo-700 bg-indigo-50 border-b border-indigo-100">
                  {notice}
                </div>
              )}

              <div className="px-4 py-3 border-b border-slate-100">
                {familyId && inviteCode ? (
                  <>
                    <p className="text-xs font-medium text-slate-500 mb-2">현재 내 가족 코드</p>
                    <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 mb-3">
                      <span className="text-sm font-bold tracking-[0.25em] text-slate-800">{inviteCode}</span>
                      <button
                        onClick={handleCopyCode}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        복사
                      </button>
                    </div>
                    <button
                      onClick={handleShareKakao}
                      className="w-full px-3 py-2 text-sm text-left rounded-lg bg-yellow-300 text-slate-900 font-medium hover:bg-yellow-400 transition-colors"
                    >
                      카카오톡으로 초대 보내기
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowFamilyModal(true)
                    }}
                    className="w-full px-3 py-2 text-sm text-left rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                  >
                    가족코드 생성하기 / 참여하기
                  </button>
                )}
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
    </>
  )
}
