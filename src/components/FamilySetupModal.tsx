'use client'
import { useState } from 'react'
import { createFamily, joinFamilyWithCode } from '@/lib/family-utils'

interface FamilySetupModalProps {
  userId: string
  displayName: string
  onSuccess: () => void
}

export function FamilySetupModal({
  userId,
  displayName,
  onSuccess,
}: FamilySetupModalProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await createFamily(familyName, userId)
    if (result) {
      setSuccessMessage(
        `✨ 가족 "${familyName}"이 생성되었습니다!\n\n초대 코드: ${result.inviteCode}\n\n이 코드를 공유하여 가족 구성원을 초대하세요.`
      )
      setTimeout(() => {
        setSuccessMessage('')
        onSuccess()
      }, 2000)
    } else {
      setError('가족 생성에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await joinFamilyWithCode(inviteCode, userId)
      setSuccessMessage('✨ 가족에 성공적으로 참여했습니다!')
      setTimeout(() => {
        setSuccessMessage('')
        onSuccess()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '실패했습니다.')
      setLoading(false)
    }
  }

  if (successMessage) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
          <p className="text-lg font-medium whitespace-pre-line">{successMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm mx-4">
        <h2 className="text-2xl font-bold mb-2">
          {displayName}님, 환영합니다! 👋
        </h2>
        <p className="text-slate-600 mb-6">
          가족 그룹을 선택하거나 생성해주세요.
        </p>

        {mode === 'select' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium"
            >
              새 가족 그룹 생성
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-medium"
            >
              초대 코드로 참여
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateFamily} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                가족 이름 (예: 김가네)
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="가족 이름을 입력하세요"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                disabled={loading}
                className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 disabled:opacity-50"
              >
                돌아가기
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                {loading ? '생성 중...' : '생성하기'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinFamily} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                초대 코드 (6자리)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) =>
                  setInviteCode(e.target.value.toUpperCase().slice(0, 6))
                }
                placeholder="ABCD12"
                required
                maxLength={6}
                disabled={loading}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('select')}
                disabled={loading}
                className="flex-1 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 disabled:opacity-50"
              >
                돌아가기
              </button>
              <button
                type="submit"
                disabled={loading || inviteCode.length !== 6}
                className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                {loading ? '참여 중...' : '참여하기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
