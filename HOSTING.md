# Hosting Guide

이 프로젝트는 정적 사이트라 Cloudflare Pages, Vercel, GitHub Pages에 배포할 수 있습니다.

## 방법 A) GitHub 연결 배포 (권장)
1. 이 폴더를 GitHub 저장소에 push
2. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git
3. 저장소 선택
4. Build settings:
   - Framework preset: None
   - Build command: (비워두기)
   - Build output directory: `/`
5. Deploy

## 방법 B) Direct Upload
1. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Upload assets
2. `/Users/taeheekang/Documents/padlet-apple-clone` 폴더 내용 업로드
3. Deploy site

## 중요한 포인트
- 현재 버전은 Supabase 없이 로컬 저장만 사용합니다.
- 배포해도 사용자별 데이터는 각자 브라우저에 저장됩니다.
- 다른 기기로 옮기려면 앱 상단 `백업` / `복원`을 사용하세요.
- `_redirects` 파일을 포함했기 때문에 `?board=xxx` 쿼리 링크도 동일하게 `index.html`로 처리됩니다.

## 배포 후 테스트
1. 배포 URL 접속
2. 카드 추가
3. 새로고침 후 카드 유지 확인
4. `백업` 파일 내보내기
5. 다른 브라우저에서 `복원`으로 복원 확인
