-- Supabase SQL: 다음 SQL을 Supabase 대시보드 > SQL Editor에서 실행하세요

-- 1. families 테이블
CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- 2. family_members 테이블
CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member', -- 'admin' 또는 'member'
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- 3. profiles 테이블 (사용자 프로필)
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. meetings 테이블에 family_id 추가 (기존 테이블 수정)
ALTER TABLE meetings ADD COLUMN family_id uuid REFERENCES families(id) ON DELETE CASCADE;

-- 5. RLS (Row Level Security) 정책 설정

-- families 테이블: 자신의 가족만 조회
CREATE POLICY "Users can view their families" ON families
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM family_members WHERE family_members.family_id = families.id AND family_members.user_id = auth.uid())
);

-- family_members 테이블: 자신의 가족 멤버만 조회
CREATE POLICY "Users can view family members" ON family_members
FOR SELECT TO authenticated
USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- meetings 테이블: 자신의 가족 회의만 조회
CREATE POLICY "Users can view their family meetings" ON meetings
FOR SELECT TO authenticated
USING (
  family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_meetings_family_id ON meetings(family_id);
CREATE INDEX idx_families_invite_code ON families(invite_code);
