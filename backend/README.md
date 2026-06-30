# 백엔드 설치 가이드 (Cloudflare Workers) — 초보자용

이 백엔드를 붙이면 여러 사람이 각자 PC에서 제출한 데이터가 **한 곳에 모입니다.**
관리자 화면에서 전원 데이터가 보이고, "자기 것만 보이는" 증상이 사라집니다.

> 터미널/명령어 없이 **웹 화면(대시보드)만으로** 끝나는 방법입니다.
> 큰 흐름: ① 가입 → ② Worker 만들기 → ③ 코드 붙여넣기 → ④ 저장소(KV) 연결 → ⑤ 주소를 index.html에 넣기

---

## 0. 개념 1분 정리 (공부용)

- **Worker** = 인터넷에 떠 있는 작은 프로그램. 누가 요청을 보내면 받아서 처리하고 응답함. (= 백엔드)
- **요청 두 종류**
  - `POST` : "이 데이터 저장해줘" (폼 제출할 때)
  - `GET` : "저장된 거 다 줘" (관리자 화면 열 때)
- **KV** = Worker가 데이터를 저장해두는 아주 단순한 창고(key-value 저장소).
  - 우리는 `sub:사람이름` 을 key 로, 그 사람 입력값을 value 로 저장함.
  - 같은 사람이 다시 내면 같은 key라서 자동으로 덮어써짐(중복 방지).

---

## 1. Cloudflare 가입 (무료, 카드 필요 없음)

1. https://dash.cloudflare.com/sign-up 접속 → 이메일/비번으로 가입
2. 이메일 인증 완료

---

## 2. Worker 만들기

1. 왼쪽 메뉴에서 **Compute (Workers)** → **Workers & Pages** 클릭
2. **Create application** (또는 Create) → **Workers** 탭 → **Create Worker**
3. 이름 입력 (예: `choo-fwdlp`) → **Deploy** 클릭
   - 일단 기본 "Hello World"가 배포됩니다. 곧 우리 코드로 바꿉니다.
4. 배포되면 주소가 나옵니다: `https://choo-fwdlp.<내아이디>.workers.dev`
   - **이 주소를 메모해두세요.** 나중에 `index.html`에 넣을 주소입니다.

---

## 3. 코드 붙여넣기

1. 그 Worker 화면에서 **Edit code** (또는 `</> Edit code`) 클릭 → 온라인 코드 편집기가 열림
2. 편집기에 있는 기본 코드를 **전부 지우고**, 이 폴더의 [`worker.js`](./worker.js) 내용을 **통째로 붙여넣기**
3. 오른쪽 위 **Deploy** 클릭

> 지금 GET은 동작하지만 저장소(KV)를 아직 안 붙여서 POST는 에러납니다. 다음 단계에서 붙입니다.

---

## 4. 저장소(KV) 만들고 연결 — ⭐ 가장 중요

### 4-1. KV 네임스페이스 만들기
1. 왼쪽 메뉴 **Storage & Databases** → **KV** 클릭
2. **Create a namespace** → 이름 입력 (예: `submissions`) → 만들기

### 4-2. Worker에 연결(바인딩)
1. 다시 **Workers & Pages** → 내 Worker(`choo-fwdlp`) 클릭
2. 상단 **Settings** → **Bindings** (또는 Variables and Secrets) → **Add binding**
3. **KV namespace** 종류 선택
4. 입력값 두 개:
   - **Variable name(변수명): `SUBMISSIONS`**  ← 반드시 대문자로 정확히 이 철자! (코드가 이 이름을 찾습니다)
   - **KV namespace**: 방금 만든 `submissions` 선택
5. **Deploy / Save** 클릭

> 변수명을 `SUBMISSIONS` 와 다르게 적으면 저장이 안 됩니다. 이 부분만 정확하면 끝입니다.

---

## 5. 잘 되는지 테스트 (index.html 건드리기 전에)

1. 브라우저 새 탭에서 내 Worker 주소를 그냥 열어보세요:
   `https://choo-fwdlp.<내아이디>.workers.dev`
2. 화면에 `[]` (빈 배열)이 보이면 → **GET 정상 동작!** (아직 데이터가 없어서 빈 배열)
3. `error`나 빈 화면이면 → 4단계(KV 변수명 `SUBMISSIONS`)를 다시 확인하세요.

---

## 6. 프론트엔드에 주소 넣기 (마지막)

1. `index.html`을 열어 `API_BASE` 줄을 내 Worker 주소로 수정:
   ```js
   const API_BASE = "https://choo-fwdlp.<내아이디>.workers.dev";
   ```
2. 저장 후 `index.html`을 웹서버에 다시 올리기

---

## 7. 최종 확인

1. `index.html`을 열면 관리자 탭 상단이 **"백엔드 연결"** 상태로 바뀜 (이전의 "임시 저장(브라우저 로컬)" 사라짐)
2. **서로 다른 PC/브라우저 2대**에서 각각 제출
3. 관리자 탭 → 둘 다 보이면 **성공** 🎉

---

## 문제 해결

- **관리자 화면에 여전히 1명만 보임** → `API_BASE`에 주소를 제대로 넣었는지, 저장 후 서버에 다시 올렸는지 확인.
- **저장은 되는데 목록이 안 뜸 / 에러** → KV 바인딩 변수명이 정확히 `SUBMISSIONS`인지 확인(4-2).
- **CORS 오류** → `worker.js`를 그대로 붙여넣었는지 확인. (CORS 처리가 코드에 이미 들어있음)
- **코드 고친 뒤 반영 안 됨** → Edit code 화면에서 **Deploy**를 다시 눌렀는지 확인.

## 무료 한도 (걱정 안 해도 됨)
- Worker 요청 하루 100,000건, KV 읽기 하루 100,000건 등 — 사내 폼 규모에는 차고 넘칩니다.
