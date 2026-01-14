// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 다른 파일에서 이 supabase를 가져다 쓸 수 있게 내보냅니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)