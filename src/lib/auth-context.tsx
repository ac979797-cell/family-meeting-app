'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  familyId: string | null
  familyName: string | null
  displayName: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    // 초기 세션 확인
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      const authUser = data?.session?.user ?? null
      setUser(authUser)

      if (authUser) {
        await loadUserFamilyInfo(authUser.id)
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
          loadUserFamilyInfo(authUser.id)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  async function loadUserFamilyInfo(userId: string) {
    try {
      // 1. 사용자 프로필 조회
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single()

      setDisplayName(profileData?.display_name ?? null)

      // 2. 사용자가 속한 첫 번째 가족 조회
      const { data: memberData } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (memberData) {
        setFamilyId(memberData.family_id)

        // 3. 가족 이름 조회
        const { data: familyData } = await supabase
          .from('families')
          .select('name')
          .eq('id', memberData.family_id)
          .single()

        setFamilyName(familyData?.name ?? null)
      }
    } catch (error) {
      console.error('가족 정보 로드 오류:', error)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setFamilyId(null)
    setFamilyName(null)
    setDisplayName(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, familyId, familyName, displayName, signOut }}
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
