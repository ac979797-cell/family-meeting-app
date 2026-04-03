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

    // 1. 가족 생성
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert([
        {
          name: familyName,
          invite_code: inviteCode,
          created_by: userId,
        },
      ])
      .select()
      .single()

    if (familyError) throw familyError

    // 2. 생성자를 admin으로 추가
    const { error: memberError } = await supabase
      .from('family_members')
      .insert([
        {
          family_id: familyData.id,
          user_id: userId,
          role: 'admin',
        },
      ])

    if (memberError) throw memberError

    return {
      familyId: familyData.id,
      inviteCode: inviteCode,
    }
  } catch (error) {
    console.error('가족 생성 오류:', error)
    return null
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
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()

    if (familyError || !familyData) {
      throw new Error('유효하지 않은 초대 코드입니다.')
    }

    // 2. 이미 가족에 속하는지 확인
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyData.id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      throw new Error('이미 이 가족에 속해있습니다.')
    }

    // 3. 가족에 추가
    const { error: joinError } = await supabase
      .from('family_members')
      .insert([
        {
          family_id: familyData.id,
          user_id: userId,
          role: 'member',
        },
      ])

    if (joinError) throw joinError

    return familyData.id
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
 * 6자리 무작위 초대 코드 생성
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
