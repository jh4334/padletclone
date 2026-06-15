# Local Boardly Setup

이 버전은 Supabase를 붙일 수 있고, 키가 없거나 연결에 실패하면 브라우저 로컬 저장으로 fallback 됩니다.

## 저장 구조

- 카드/섹션/댓글/반응: Supabase 연결 시 `boardly_boards` 테이블, 연결 전에는 브라우저 `localStorage`
- 첨부 파일: 브라우저 `IndexedDB`
- 백업/복원: 앱 상단 `백업` / `복원`

## Supabase 연결

1. Supabase SQL Editor에서 `supabase-schema.sql` 내용을 실행한다.
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

- 현재 구현은 자동 실시간 충돌 해결이 아니라 마지막 저장이 이기는 스냅샷 동기화입니다.
- 같은 브라우저/같은 프로필 안에서는 로컬 fallback으로도 계속 저장됩니다.
- 다른 컴퓨터로 옮기려면 `백업` 파일을 내보내고, 대상 기기에서 `복원` 하면 됩니다.
- 첨부 파일 본문은 아직 Supabase Storage가 아니라 브라우저 `IndexedDB`에 저장됩니다.

## 개인 활용 방식

1. 주로 쓰는 브라우저에서 보드를 만든다.
2. 중요한 작업을 정리한 뒤 `백업`을 눌러 파일로 보관한다.
3. 다른 컴퓨터나 브라우저에서 쓰려면 `복원`으로 같은 데이터를 불러온다.
4. CSV(Comma-Separated Values, 콤마 구분 값)는 작업 목록을 엑셀에서 볼 때 사용한다.
