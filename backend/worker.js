/**
 * Claude 방화벽·DLP 단말정보 수집 - Cloudflare Worker 백엔드
 *
 * 프론트엔드(index.html)와의 약속(계약):
 *   - POST  /   본문 JSON { person, dept, empno, pcs:[...] , ... } 1건 저장
 *               같은 person 이면 덮어쓰기(upsert). 중복으로 쌓이지 않음.
 *   - GET   /   저장된 전체 목록을 JSON 배열로 반환
 *
 * 저장소: Cloudflare KV (간단한 key-value 데이터베이스, 무료)
 *   - 사람마다 키를 따로 쓴다: "sub:홍길동" -> 그 사람 레코드(JSON)
 *   - 이렇게 사람별로 키를 나누면, 두 명이 동시에 제출해도 서로를 덮어쓰지 않는다.
 *
 * 필요한 바인딩: KV 네임스페이스를 변수명 SUBMISSIONS 로 연결해야 한다(가이드 참고).
 */

// 어느 출처(웹사이트)에서 불러도 허용. 사내 전용으로 좁히려면 "*" 대신 도메인을 넣으면 됨.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// JSON 응답을 만들 때 CORS 헤더까지 항상 붙여주는 도우미 함수
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default {
  async fetch(request, env) {
    // 1) 브라우저가 본 요청 전에 보내는 사전점검(preflight)에 응답
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // 2) 목록 조회
    if (request.method === "GET") {
      // "sub:" 로 시작하는 키를 모두 나열한 뒤, 각 값을 읽어 배열로 반환
      const list = await env.SUBMISSIONS.list({ prefix: "sub:" });
      const out = [];
      for (const key of list.keys) {
        const val = await env.SUBMISSIONS.get(key.name);
        if (val) {
          try { out.push(JSON.parse(val)); } catch (e) { /* 깨진 값은 건너뜀 */ }
        }
      }
      return json(out);
    }

    // 3) 1건 저장(upsert)
    if (request.method === "POST") {
      let rec;
      try {
        rec = await request.json();
      } catch (e) {
        return json({ ok: false, error: "잘못된 JSON 본문" }, 400);
      }
      if (!rec || !rec.person) {
        return json({ ok: false, error: "person 값이 필요합니다" }, 400);
      }
      // 키 = "sub:사람이름". 같은 사람이면 같은 키 -> 자동으로 덮어쓰기(upsert)
      await env.SUBMISSIONS.put("sub:" + rec.person, JSON.stringify(rec));
      return json({ ok: true, person: rec.person });
    }

    // 그 외 메서드
    return json({ ok: false, error: "지원하지 않는 요청" }, 405);
  },
};
