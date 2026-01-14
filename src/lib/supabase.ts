import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 빌드 시점에 에러가 나지 않도록 유연하게 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey)