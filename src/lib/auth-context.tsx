'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { ensureUserProfile } from './family-utils'

interface AuthContextType {
  user: User | null
  loading: boolean
  familyId: string | null
  familyName: string | null
  inviteCode: string | null
  displayName: string | null
  refreshFamilyInfo: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    // 초기 세션 확인
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      const authUser = data?.session?.user ?? null
      setUser(authUser)

      if (authUser) {
        await loadUserFamilyInfo(authUser)
      } else {
        setFamilyId(null)
        setFamilyName(null)
        setInviteCode(null)
        setDisplayName(null)
      }

      setLoading(false)
    }

    checkSession()

    // 인증 상태 변화 감시
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const authUser = session?.user ?? null
        setUser(authUser)
        if (authUser) {
          void loadUserFamilyInfo(authUser)
        } else {
          setFamilyId(null)
          setFamilyName(null)
          setInviteCode(null)
          setDisplayName(null)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  async function loadUserFamilyInfo(authUser: User) {
    try {
      const ensuredDisplayName = await ensureUserProfile(authUser)
      setDisplayName(ensuredDisplayName)

      const { data: memberData } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', authUser.id)
        .limit(1)
        .maybeSingle()

      if (memberData?.family_id) {
        setFamilyId(memberData.family_id)

        const { data: familyData } = await supabase
          .from('families')
          .select('name, invite_code')
          .eq('id', memberData.family_id)
          .maybeSingle()

        setFamilyName(familyData?.name ?? null)
        setInviteCode(familyData?.invite_code ?? null)
      } else {
        setFamilyId(null)
        setFamilyName(null)
        setInviteCode(null)
      }
    } catch (error) {
      console.error('가족 정보 로드 오류:', error)
    }
  }

  const refreshFamilyInfo = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      await loadUserFamilyInfo(data.user)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setFamilyId(null)
    setFamilyName(null)
    setInviteCode(null)
    setDisplayName(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, familyId, familyName, inviteCode, displayName, refreshFamilyInfo, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
