# Local Boardly Setup

이 버전은 Supabase를 붙일 수 있고, 키가 없거나 연결에 실패하면 브라우저 로컬 저장으로 fallback 됩니다.

## 저장 구조

- 카드/섹션/댓글/반응: Supabase 연결 시 `boardly_boards` 테이블, 연결 전에는 브라우저 `localStorage`
- 공유 권한: `view_token`, `edit_token`, `owner_id`, `access_updated_at` 컬럼과 보드 스냅샷에 함께 저장
- 공유 링크: URL의 `token`이 저장된 권한 토큰과 다르면 앱에서 `권한 없음` 상태로 잠긴다.
- 충돌 방지: 저장 직전 Supabase `updated_at`이 바뀌었으면 `원격 변경 있음` 패널이 뜬다.
- 첨부 파일: 메타데이터는 카드와 함께 저장, 파일 본문은 브라우저 `IndexedDB`
- 첨부 표시: 이미지/PDF/문서 유형과 `이 브라우저 전용` 상태를 카드에서 바로 표시
- 백업/복원: 앱 상단 `백업` / `복원`

## Supabase 연결

1. Supabase SQL Editor에서 `supabase-schema.sql` 내용을 실행한다.
   - 이전 버전 테이블이 있어도 다시 실행하면 권한 메타데이터 컬럼이 추가된다.
2. Project Settings -> API에서 `anon` 또는 `publishable` key를 복사한다.
3. `boardly.config.js`의 `SUPABASE_ANON_KEY`에 붙여넣는다.
4. 브라우저에서 새로고침 후 상단 상태가 `Cloud loaded` 또는 `Cloud saved`로 바뀌는지 확인한다.

`service_role` secret key는 브라우저 앱에 넣으면 안 된다.

## 실행

```bash
cd /Users/taeheekang/Documents/padlet-apple-clone
python3 -m http.server 5177 --bind 127.0.0.1
```

브라우저에서 접속:

```text
http://127.0.0.1:5177/index.html?board=my-workspace
```

## 중요한 한계

- 현재 구현은 자동 병합이 아니라 충돌 감지 후 사용자가 선택하는 스냅샷 동기화입니다.
- `원격 변경 있음`이 뜨면 `원격 불러오기`, `로컬 유지`, `백업 후 덮어쓰기` 중 하나를 선택해야 합니다.
- 읽기/편집 토큰은 앱에서 검증되고 Supabase 행에도 저장되지만, 지금 SQL 정책은 no-login 프로토타입을 위해 공개 상태입니다. 진짜 서버 보안은 로그인 기반 RLS(Row Level Security, 행 수준 보안) 또는 서버/Edge Function 토큰 검증을 붙여야 완성됩니다.
- 같은 브라우저/같은 프로필 안에서는 로컬 fallback으로도 계속 저장됩니다.
- 다른 컴퓨터로 옮기려면 `백업` 파일을 내보내고, 대상 기기에서 `복원` 하면 됩니다.
- 첨부 파일 본문은 아직 Supabase Storage가 아니라 브라우저 `IndexedDB`에 저장됩니다. 다른 브라우저에서 열면 파일 본문이 없다고 표시될 수 있습니다.

## 개인 활용 방식

1. 주로 쓰는 브라우저에서 보드를 만든다.
2. 중요한 작업을 정리한 뒤 `백업`을 눌러 파일로 보관한다.
3. 다른 컴퓨터나 브라우저에서 쓰려면 `복원`으로 같은 데이터를 불러온다.
4. CSV(Comma-Separated Values, 콤마 구분 값)는 작업 목록을 엑셀에서 볼 때 사용한다.
