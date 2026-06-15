# Local Boardly Setup

이 버전은 Supabase, Firebase, 별도 서버, 외부 DB(Database, 데이터베이스)를 사용하지 않습니다.

## 저장 구조

- 카드/섹션/댓글/반응: 브라우저 `localStorage`
- 첨부 파일: 브라우저 `IndexedDB`
- 백업/복원: 앱 상단 `백업` / `복원`

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

- 다른 기기와 자동 실시간 동기화는 없습니다.
- 같은 브라우저/같은 프로필 안에서는 계속 저장됩니다.
- 다른 컴퓨터로 옮기려면 `백업` 파일을 내보내고, 대상 기기에서 `복원` 하면 됩니다.
- 브라우저 데이터를 삭제하면 로컬 보드와 첨부 파일도 사라질 수 있습니다.

## 개인 활용 방식

1. 주로 쓰는 브라우저에서 보드를 만든다.
2. 중요한 작업을 정리한 뒤 `백업`을 눌러 파일로 보관한다.
3. 다른 컴퓨터나 브라우저에서 쓰려면 `복원`으로 같은 데이터를 불러온다.
4. CSV(Comma-Separated Values, 콤마 구분 값)는 작업 목록을 엑셀에서 볼 때 사용한다.
