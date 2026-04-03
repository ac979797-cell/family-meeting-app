# 카카오 로그인 + 가족 그룹 관리 구현 완료 가이드

## ✅ 구현된 기능

### 1. **Kakao OAuth 로그인**
- 로그인 페이지에 "Kakao로 로그인" 버튼 추가
- Kakao 계정으로 매끄러운 로그인 경험
- 첫 로그인 시 카카오 닉네임으로 프로필 생성

### 2. **가족 그룹 관리**
- **초대 코드 시스템**: 6자리 코드로 가족 구성원 추가
- **첫 로그인 플로우**: 새 사용자는 가족 생성 또는 참여 선택
- **가족별 독립적 관리**: 각 가족은 자신의 회의록만 조회 가능

### 3. **액세스 제어**
- 로그인한 사용자만 회의록 작성/조회 가능
- 사용자는 자신의 가족 회의록만 조회 가능
- URL 직접 접근 방지 (ProtectedRoute)

---

## 🚀 설정 및 배포 절차

### Step 1: Supab ase 데이터베이스 마이그레이션

1. Supabase 대시보드 로그인 (https://supabase.com)
2. 프로젝트 선택 → **SQL Editor** 클릭
3. `migrations.sql` 파일의 모든 SQL 복사
4. SQL Editor에 붙여넣고 **실행** 클릭

**주의**: RLS(Row Level Security) 정책이 자동으로 설정되어 사용자별 접근 제어가 작동합니다.

---

### Step 2: Kakao Developers 앱 등록

**[자세한 가이드는 KAKAO_SETUP.md 참고]**

요약:
1. https://developers.kakao.com 접속
2. 앱 등록 (이름: "우리 가족 회의")
3. 앱 설정 → **Kakao Login** → **Redirect URI 설정**
   - 개발: `http://localhost:3000/auth/callback`
   - 프로덕션: `https://yourdomain.com/auth/callback`
4. **REST API 키** 복사

---

### Step 3: Supabase에서 Kakao OAuth 활성화

1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Kakao** 검색 후 활성화
3. **Client ID** 필드에 Kakao REST API 키 입력
4. **Secret** 필드는 비워두기 (Kakao는 필요 없음)
5. **Save** 클릭

---

### Step 4: 환경 변수 설정

`.env.local.example`을 `.env.local`로 복사:
```bash
cp .env.local.example .env.local
```

`.env.local` 파일 수정:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_KAKAO_JS_KEY=your-kakao-rest-api-key-here
```

---

### Step 5: 앱 실행 및 테스트

```bash
npm install
npm run dev
```

1. http://localhost:3000/login 접속
2. **Kakao로 로그인** 버튼 클릭
3. 카카오 계정으로 인증
4. **가족 그룹 생성** 선택 (첫 사용자)
5. 가족 이름 입력 (예: "김가네")
6. ✅ 초대 코드 발급됨

---

## 👥 새 가족 구성원 추가 방법

### 1단계: 관리자가 초대 코드 공유
- 로그인 후 "사용자 메뉴"에서 초대 코드 확인
- 가족 구성원에게 신청 링크 + 초대 코드 공유

### 2단계: 신규 사용자가 Kakao로 로그인
- "Kakao로 로그인" 클릭
- **초대 코드로 참여** 선택
- 받은 초대 코드 6자리 입력
- ✅ 가족에 자동으로 추가됨

---

## 📁 주요 파일 구조

```
src/
├── app/
│   └── login/
│       └── page.tsx              # ✨ Kakao 로그인 버튼 추가
│   └── minutes/
│       ├── page.tsx              # ✨ 가족별 회의록 필터링
│       └── new/page.tsx          # ✨ family_id 저장
├── components/
│   ├── FamilySetupModal.tsx      # ✨ 신규 가족 그룹 생성/참여
│   └── ProtectedRoute.tsx        # 🔐 로그인 필수
├── lib/
│   ├── auth-context.tsx          # ✨ 가족 정보 포함
│   ├── family-utils.ts           # ✨ 가족 관리 헬퍼 함수
│   └── supabase.ts
└── types/
    └── kakao.d.ts               # ✨ Kakao SDK 타입 정의

migrations.sql                     # ✨ 데이터베이스 스키마
KAKAO_SETUP.md                     # ✨ Kakao 설정 가이드
.env.local.example                 # ✨ 환경 변수 템플릿
```

---

## 🎯 사용자 플로우 다이어그램

### 첫 방문 사용자
```
로그인 페이지
    ↓
[Kakao로 로그인]
    ↓
Kakao 인증
    ↓
가족 그룹 설정
├─ 새 가족 생성 → 가족명 입력 → 소유자 권한 → 초대코드 발급 ✓
└─ 초대코드로 참여 → 코드 입력 → 구성원 권한 → 참여 완료 ✓
    ↓
회의록 목록 화면 (해당 가족의 회의록만 표시)
```

### 맴버 추가
```
기존 멤버: "초대코드: ABC123" 공유
    ↓
신규 사용자: [Kakao로 로그인]
    ↓
[초대코드로 참여] → "ABC123" 입력
    ↓
✓ 가족에 자동으로 추가됨
```

---

## 🔒 보안 기능

### 1. 행 수준 보안 (RLS)
- 모든 쿼리에 `family_id` 필터 자동 적용
- 사용자는 자신의 가족 데이터만 접근 가능
- 서버 사이드 강제 실행

### 2. 인증 보호
- 모든 페이지에 `ProtectedRoute` 래퍼 적용
- 미인증 사용자 자동 로그인 페이지로 리다이렉트

### 3. 초대 코드
- 6자리 난수 생성 (2,176,782,336 조합)
- 고유성 보증 (데이터베이스 제약)

---

## 🐛 트러블슈팅

### Q: "초대 코드가 작동하지 않습니다"
A: 
1. 코드를 정확히 대문자로 입력 확인
2. 코드 만료 여부 확인 (코드 자체에 만료 기능이 없으므로, 필요시 추가 구현)
3. 다른 가족의 코드가 아닌지 확인

### Q: "회의록이 표시되지 않습니다"
A:
1. 로그인 사용자가 올바른 가족에 속해있는지 확인
2. 회의록이 올바른 `family_id`로 저장되었는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### Q: "Kakao 로그인 버튼이 나타나지 않습니다"
A:
1. `NEXT_PUBLIC_KAKAO_JS_KEY` 환경 변수 설정 확인
2. Supabase에서 Kakao provider 활성화 확인
3. 개발자 콘솔(F12)에서 네트워크 오류 확인

### Q: "가족 설정 모달이 루프에 빠졌습니다"
A:
- 데이터베이스 마이그레이션이 완전히 실행되었는지 확인
- `family_members` 테이블이 생성되었는지 확인

---

## 📈 향후 개선 사항 (선택사항)

- [ ] 조직도/가족 멤버 관리 페이지
- [ ] 초대 코드 만료 기능 (7일 유효)
- [ ] 멤버별 권한 관리 (admin/member)
- [ ] 주간 회의 자동 알림
- [ ] 메시지 또는 푸시 알림
- [ ] 데이터 내보내기 (PDF)

---

## 📞 문의 및 지원

구현 중 문제가 발생하면:
1. 이 가이드의 트러블슈팅 섹션 확인
2. 브라우저 콘솔 및 Supabase 로그 확인
3. migrations.sql 실행 여부 재확인

---

**마지막 업데이트**: 2026년 4월 3일
**버전**: 1.0.0
