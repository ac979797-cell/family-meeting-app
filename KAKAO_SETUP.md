# Kakao OAuth 설정 가이드

## Step 1: Kakao Developers에서 앱 등록

1. https://developers.kakao.com 접속
2. 로그인 후 "내 애플리케이션" → "애플리케이션 추가"
3. 앱 이름: "우리 가족 회의"
4. 비즈니스 타입: "개인" 선택 후 등록

## Step 2: REST API 키 확인

1. 앱 선택 → "앱 설정" → "기본 정보"
2. "REST API 키" 복사 (예: abc123def456ghi789)

## Step 3: OAuth 리다이렉트 URI 설정

1. "제품" → "Kakao Login" → "설정"
2. "Redirect URI" 추가:
   - 개발 환경: `http://localhost:3000/auth/callback`
   - 배포 환경: `https://yourdomain.com/auth/callback`
3. "저장"

## Step 4: Supabase 연동 설정

1. Supabase 프로젝트 → "Authentication" → "Providers" 진입
2. "Kakao" 검색하여 활성화
3. Kakao Developers에서 복사한 **REST API 키**를 Supabase의 `Client ID` 필드에 입력
4. Secret 필드는 비워두기 (Kakao는 클라이언트 사이드 로그인만 지원)
5. "Save" 클릭

## Step 5: 환경 변수 설정

`.env.local` 파일 생성 또는 수정:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 6: 테스트

1. 앱 실행: `npm run dev`
2. 로그인 페이지 접속: `http://localhost:3000/login`
3. "Kakao로 로그인" 버튼 클릭
4. 카카오 계정으로 로그인
5. 첫 로그인 시 가족 그룹 생성/선택

---

**Note**: Kakao OAuth는 클라이언트 사이드 인증만 지원하므로 Secret이 필요 없습니다.
