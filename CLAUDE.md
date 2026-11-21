답변은 항상 한국어로.
# BLOCK CHASE (블록체이스) — Claude Code 작업 규칙

이 저장소는 Google Play 앱 "블록 체이스 (BLOCK CHASE)"의 **라이브 서비스 파일**입니다.
`index.html`은 GitHub Pages로 바로 배포되어 설치된 앱(TWA)이 즉시 읽습니다. 푸시 = 배포입니다.

## 파일
- `index.html` — 게임 전체(React 번들을 압축한 단일 파일, 약 2.4MB). 수정은 항상 이 파일에 직접.
- `sw.js` — 서비스 워커(v3). 꼭 필요할 때만 수정.
- `bc_config.json` — 서버(Apps Script) 주소 `{"statsUrl":"…/exec"}`. 절대 형식을 깨지 말 것.
- `privacy.html`, `terms.html`, `LICENSE`, `README.md` — Play 심사와 연결된 문서. 내용 변경 시 사용자에게 먼저 알릴 것.
- `tools/` — 검사 도구(아래). `_notes/` — 인수인계서·로드맵·서버 코드·교환표(배포 대상 아님, .gitignore).

## 패치 절차 (반드시 이 순서)
1. 변경은 **고유한 문자열 1곳 치환**으로. 치환 전 해당 문자열이 정확히 1번 나오는지 확인하고, 0 또는 2번 이상이면 멈추고 보고.
2. 버전 문자열 **3곳**을 함께 올림: `>v17.XX<`, `build 17.XX · © 2026 Chae Lab`, `var V="17.XX"`. 하나라도 빠지면 앱이 무한 새로고침·구버전 잔류.
3. `L1=!1`(개발 모드 해제)이 유지되는지 확인. 절대 `L1=!0`으로 올리지 말 것.
4. `node --check`로 4개 `<script>` 블록 문법 검사(블록 추출 후 각각). 실패 시 되돌림.
5. 캠페인 판(`bcCellSwap`, `bcSeedR`, `bcLvOv`, 돌벽·미션)을 건드렸으면 `node tools/fullcheck.js <test.html>` 실행 → 막다른 칸·악마 도달·열쇠 도달·존 목표 모두 비어 있어야 함. test.html은 `<script type="module" crossorigin>`을 `<script>`로 바꾼 사본.
6. UI 변경은 가능하면 Playwright 스크린샷으로 확인(홈·캠페인 맵·게임판·갤러리·무한). 애니메이션·토스트·텍스트 줄바꿈은 눈으로 봐야 함.
7. `_notes/BLOCK_CHASE_handoff_v17_XX.md` 맨 끝에 `# 28.NNN vXX.XX — 제목 (날짜)` 형식으로 원인·수정·검증을 기록. 파일명의 버전도 함께 올림.
8. 커밋 메시지는 `v17.XX: 한 줄 요약`. 푸시 전 변경 파일 목록을 사용자에게 보여 주고 확인받을 것. 푸시 후 "1~3분 뒤 폰에서 build 17.XX 확인"을 안내.

## 코딩 제약 (어기면 실기기에서 깨짐)
- **새 Tailwind 클래스 금지** — 번들 CSS에 없는 클래스는 무효. 스타일은 인라인 `style={{…}}` 또는 `<style>` 블록에 직접 정의한 클래스만.
- 타일 연출에 `box-shadow` 사용 금지(`.bc-concave`의 `!important`에 가려짐). `outline`/`filter` 사용.
- `const` 체인(`a=…,b=…,c=…`) 분리 금지 — 새 정의는 체인 멤버로 삽입.
- SVG 필터 금지, `animation-delay`에는 `fill:backwards`.
- 토스트·안내문은 `y(한국어, 영어)` 번역 함수로. 한국어 리터럴을 직접 넘기지 말 것. 표시 시 `bcNl()`이 문장 단위 줄바꿈.
- 서버 관련: 앱이 보내는 데이터 유형(별명·게임 기록·기기 ID·던전)을 **새로 추가하면** Play 데이터 보안 재신고가 필요하므로 코드 전에 사용자에게 알릴 것. 댓글·이메일·위치는 넣지 않음.
- 신고·차단·약관 동의·금칙어 기능은 Play UGC 정책 요건 — 제거·약화 금지.

## 판·난이도
- 별 기준: `bcParO[층]=[3★,2★]`(우선) → `bcParM[층]`(솔버 M)×1.6/×2 → `bcParF` 공식. 실측 보정 시 2★=3★×1.24 반올림.
- 판 수정은 `bcCellSwap`(층별 [[돌벽 r,c],[대상 r,c]] 목록, 돌벽↔일반 color만)로. 시드 변경(`bcSeedR`)은 M 재측정이 필요하므로 피함.
- 보스층 입장 조건 `BC_BOSS_NEED=18`(맵·결과창 공통).

## 서버(Apps Script) 운영 — Claude가 직접 수행
사용자는 개발자가 아니므로 구글 쪽 작업(시트 확인, 서버 배포)을 사용자에게 시키지 말고 아래 도구로 직접 한다.
- 소스: `_notes/server/Code.js`(clasp 프로젝트, 커밋 안 됨). **Apps Script 편집기에 붙여 넣게 하는 방식은 쓰지 않는다**(v3.4 때 다른 파일이 붙여 넣어져 두 번 실패).
- `node tools/server.js check` — 서버 응답·버전 확인(데이터 변경 없음). 서버를 건드린 뒤와 앱 푸시 전에 실행.
- `node tools/server.js summary | floors [all] | gallery` — 시트 요약 / 층별 기기 수·별 분포·클리어 수 / 던전 목록. 읽기 전용이며 응답에 기기 ID가 없다.
- `node tools/server.js deploy "설명"` — 문법 검사 → `clasp push` → **같은 배포 ID에 새 버전**(주소 불변) → check. 실행 전 사용자에게 한 번 확인받는다.
- 서버를 수정하면 `_notes/BLOCK_CHASE_stats_AppsScript_vX_Y.gs` 사본을 남기고, 모의 시트 시험(doPost를 node vm으로 실행) 후 배포한다.
- `_notes/server/.admin_key`(관리자 조회 키)는 출력·커밋·전송 금지. 서버 코드에는 SHA-256 해시만 둔다.
- 유저 번호 발급(`uname`)은 호출할 때마다 번호가 소모되므로 시험 삼아 호출하지 않는다.
- 로그인이 만료되면 `npx clasp login`을 실행하고 사용자가 브라우저에서 허용한다(계정 설정의 Apps Script API가 켜져 있어야 함). 비밀번호를 묻지 않는다.
- 별 기준 자동 보정은 보류 중: `floors`에서 층당 기기 수가 20대 안팎이 되면 제안 기준표부터 만든다.

## 금지
- `BC:CONQUER:SET` 테스트 명령 사용 금지(실제 정복 순번 등록됨).
- `bc_config.json`의 주소 변경 금지(서버 재배포는 "새 버전"으로 주소 유지).
- 사용자가 틀렸어도 맞다고 하지 말 것. 실수는 원인까지 인수인계서에 기록.

## 테스트 환경 메모
- jsdom으로 홈 렌더는 가능하나 `Element.animate`·좌표가 없어 연출·맵 섹션 토글은 재현 불가 → Playwright 권장.
- 컨테이너 초기화 교훈: 도구는 저장소 `tools/`에 두고 커밋.
