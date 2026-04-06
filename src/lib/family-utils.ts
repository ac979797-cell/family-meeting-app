import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * 새로운 가족 생성
 */
export async function createFamily(
  familyName: string,
  userId: string
): Promise<{ familyId: string; inviteCode: string } | null> {
  try {
    const inviteCode = generateInviteCode()
    const familyId = crypto.randomUUID()

    // 1. 가족 생성
    const { error: familyError } = await supabase
      .from('families')
      .insert([
        {
          id: familyId,
          name: familyName,
          invite_code: inviteCode,
          created_by: userId,
        },
      ])

    if (familyError) throw familyError

    // 2. 생성자를 admin으로 추가
    const { error: memberError } = await supabase
      .from('family_members')
      .insert([
        {
          family_id: familyId,
          user_id: userId,
          role: 'admin',
        },
      ])

    if (memberError) {
      await supabase.from('families').delete().eq('id', familyId)
      throw memberError
    }

    return {
      familyId,
      inviteCode,
    }
  } catch (error) {
    console.error('가족 생성 오류:', error)
    throw error
  }
}

/**
 * 초대 코드로 가족에 참여
 */
export async function joinFamilyWithCode(
  inviteCode: string,
  userId: string
): Promise<string | null> {
  try {
    // 1. 초대 코드로 가족 찾기
    const { data: familyRows, error: familyError } = await supabase.rpc(
      'find_family_by_invite_code',
      {
        p_invite_code: inviteCode.trim().toUpperCase(),
      }
    )

    const familyId = Array.isArray(familyRows) ? familyRows[0]?.id : null

    if (familyError || !familyId) {
      throw new Error('유효하지 않은 초대 코드입니다.')
    }

    // 2. 이미 가족에 속하는지 확인
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMember) {
      throw new Error('이미 이 가족에 속해있습니다.')
    }

    // 3. 가족에 추가
    const { error: joinError } = await supabase
      .from('family_members')
      .insert([
        {
          family_id: familyId,
          user_id: userId,
          role: 'member',
        },
      ])

    if (joinError) throw joinError

    return familyId
  } catch (error) {
    console.error('가족 참여 오류:', error)
    throw error
  }
}

/**
 * 사용자 프로필 생성
 */
export async function createUserProfile(
  userId: string,
  displayName: string,
  avatarUrl?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').insert([
      {
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl || null,
      },
    ])

    if (error) throw error
    return true
  } catch (error) {
    console.error('프로필 생성 오류:', error)
    return false
  }
}

/**
 * 로그인 사용자의 프로필이 없으면 자동 생성
 */
export async function ensureUserProfile(user: User): Promise<string> {
  const displayName =
    user.user_metadata?.name ||
    user.user_metadata?.nickname ||
    user.email?.split('@')[0] ||
    '가족 구성원'

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: user.id,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
    {
      onConflict: 'user_id',
    }
  )

  if (error) {
    console.error('프로필 보정 오류:', error)
  }

  return displayName
}

/**
 * 로그인 사용자를 위한 기본 가족을 자동 보장
 */
export async function ensureUserFamily(
  userId: string,
  displayName: string
): Promise<string | null> {
  const { data: existingMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (existingMember?.family_id) {
    return existingMember.family_id
  }

  const defaultFamilyName = displayName ? `${displayName} 가족` : '우리 가족'
  const result = await createFamily(defaultFamilyName, userId)
  return result?.familyId ?? null
}

/**
 * 6자리 무작위 초대 코드 생성
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
