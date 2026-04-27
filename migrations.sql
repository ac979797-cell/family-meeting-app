-- Supabase SQL: 다음 SQL을 Supabase 대시보드 > SQL Editor에서 실행하세요

-- 1. families 테이블
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. family_members 테이블
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member', -- 'admin' 또는 'member'
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- 3. profiles 테이블 (사용자 프로필)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. meetings 테이블에 family_id 추가 (기존 테이블 수정)
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;

-- 4.5 schedules 테이블 생성
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  start_at timestamp with time zone NOT NULL,
  description text,
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_details ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_family_member(target_family_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = target_family_id
      AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_family_member(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_family_by_invite_code(p_invite_code text)
RETURNS TABLE (id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.id
  FROM public.families f
  WHERE UPPER(f.invite_code) = UPPER(p_invite_code)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_family_by_invite_code(text) TO authenticated;

DROP POLICY IF EXISTS "Users can view their families" ON families;
DROP POLICY IF EXISTS "Users can create families" ON families;
DROP POLICY IF EXISTS "Family creators can update their families" ON families;
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Users can join a family themselves" ON family_members;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their family meetings" ON meetings;
DROP POLICY IF EXISTS "Users can insert their family meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update their family meetings" ON meetings;
DROP POLICY IF EXISTS "Users can delete their family meetings" ON meetings;
DROP POLICY IF EXISTS "Users can view family meeting details" ON meeting_details;
DROP POLICY IF EXISTS "Users can insert family meeting details" ON meeting_details;
DROP POLICY IF EXISTS "Users can update family meeting details" ON meeting_details;
DROP POLICY IF EXISTS "Users can delete family meeting details" ON meeting_details;
DROP POLICY IF EXISTS "Users can view family schedules" ON schedules;
DROP POLICY IF EXISTS "Users can insert family schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update family schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete family schedules" ON schedules;

-- families 테이블: 자신의 가족만 조회
CREATE POLICY "Users can view their families" ON families
FOR SELECT TO authenticated
USING (
  created_by = auth.uid() OR public.is_family_member(id)
);

-- family_members 테이블: 자신의 가족 멤버만 조회
CREATE POLICY "Users can view family members" ON family_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR public.is_family_member(family_id)
);

-- families 테이블: 로그인한 사용자가 자신의 가족을 생성 가능
CREATE POLICY "Users can create families" ON families
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "Family creators can update their families" ON families
FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
)
WITH CHECK (
  created_by = auth.uid()
);

-- family_members 테이블: 로그인한 사용자가 자기 자신을 가족에 추가 가능
CREATE POLICY "Users can join a family themselves" ON family_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- profiles 테이블: 본인 프로필만 조회/생성/수정 가능
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- meetings 테이블: 자신의 가족 회의만 조회/작성/수정/삭제
CREATE POLICY "Users can view their family meetings" ON meetings
FOR SELECT TO authenticated
USING (
  public.is_family_member(family_id)
);

CREATE POLICY "Users can insert their family meetings" ON meetings
FOR INSERT TO authenticated
WITH CHECK (
  public.is_family_member(family_id)
);

CREATE POLICY "Users can update their family meetings" ON meetings
FOR UPDATE TO authenticated
USING (
  public.is_family_member(family_id)
)
WITH CHECK (
  public.is_family_member(family_id)
);

CREATE POLICY "Users can delete their family meetings" ON meetings
FOR DELETE TO authenticated
USING (
  public.is_family_member(family_id)
  AND meeting_date = CURRENT_DATE
);

-- schedules 테이블: 자신의 가족 일정만 조회/작성/수정/삭제
CREATE POLICY "Users can view family schedules" ON schedules
FOR SELECT TO authenticated
USING (
  public.is_family_member(family_id)
);

CREATE POLICY "Users can insert family schedules" ON schedules
FOR INSERT TO authenticated
WITH CHECK (
  public.is_family_member(family_id)
);

CREATE POLICY "Users can update family schedules" ON schedules
FOR UPDATE TO authenticated
USING (
  public.is_family_member(family_id)
)
WITH CHECK (
  public.is_family_member(family_id)
);

CREATE POLICY "Users can delete family schedules" ON schedules
FOR DELETE TO authenticated
USING (
  public.is_family_member(family_id)
);

-- meeting_details 테이블: 부모 회의의 family_id를 기준으로 접근 제어
CREATE POLICY "Users can view family meeting details" ON meeting_details
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM meetings
    WHERE meetings.id = meeting_details.meeting_id
      AND public.is_family_member(meetings.family_id)
  )
);

CREATE POLICY "Users can insert family meeting details" ON meeting_details
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM meetings
    WHERE meetings.id = meeting_details.meeting_id
      AND public.is_family_member(meetings.family_id)
  )
);

CREATE POLICY "Users can update family meeting details" ON meeting_details
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM meetings
    WHERE meetings.id = meeting_details.meeting_id
      AND public.is_family_member(meetings.family_id)
      AND meetings.meeting_date = CURRENT_DATE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM meetings
    WHERE meetings.id = meeting_details.meeting_id
      AND public.is_family_member(meetings.family_id)
      AND meetings.meeting_date = CURRENT_DATE
  )
);

CREATE POLICY "Users can delete family meeting details" ON meeting_details
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM meetings
    WHERE meetings.id = meeting_details.meeting_id
      AND public.is_family_member(meetings.family_id)
      AND meetings.meeting_date = CURRENT_DATE
  )
);

-- 6. 기존 회의록 소유자 연결 (한 번만 수동 실행)
-- ⚠️ 앱이 "내 계정"을 미리 알 수는 없습니다.
-- 반드시 본인 가족의 family_id를 확인한 뒤 아래 UPDATE를 직접 실행하세요.
-- 예시 1) 가족 목록 확인
-- SELECT f.id AS family_id, f.name AS family_name, fm.user_id
-- FROM families f
-- JOIN family_members fm ON fm.family_id = f.id
-- ORDER BY f.created_at DESC;
--
-- 예시 2) 내 기존 회의록을 내 가족으로 귀속
-- UPDATE meetings
-- SET family_id = 'YOUR_FAMILY_ID'
-- WHERE family_id IS NULL;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_meetings_family_id ON meetings(family_id);
CREATE INDEX IF NOT EXISTS idx_schedules_family_id ON schedules(family_id);
CREATE INDEX IF NOT EXISTS idx_families_invite_code ON families(invite_code);
