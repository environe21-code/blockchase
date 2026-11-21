// 서버(Apps Script) 운영 도구. 저장소 루트에서 실행.
//   node tools/server.js check              서버 응답·버전 확인(데이터 변경 없음)
//   node tools/server.js summary            시트별 행 수 등 요약(관리자 조회)
//   node tools/server.js floors             층별 기기 수·별 분포·최소 수
//   node tools/server.js gallery            공개 던전 목록(상태·신고 수)
//   node tools/server.js rankdel "이름" [층]   랭킹(scores)에서 그 이름(과 층)의 행 삭제 — 시험 데이터 정리용, 실행 전 사용자 확인
//   node tools/server.js userdel <번호>        자동 유저명 번호(users) 행 삭제 — 시험으로 소모된 번호 정리용
//   node tools/server.js deploy "설명"       _notes/server/Code.js 를 올리고 기존 배포를 새 버전으로 갱신
// 서버 소스: _notes/server/Code.js (clasp 프로젝트, .gitignore 대상). 관리자 키: _notes/server/.admin_key
// 배포 주소는 bc_config.json 의 statsUrl 에서 읽으며 절대 바꾸지 않는다(같은 배포 ID에 새 버전).
const fs = require("fs"), path = require("path"), cp = require("child_process");
const root = path.resolve(__dirname, ".."), sdir = path.join(root, "_notes", "server");
const url = JSON.parse(fs.readFileSync(path.join(root, "bc_config.json"), "utf8")).statsUrl;
const depId = (url.match(/\/s\/([^/]+)\/exec$/) || [])[1];
if (!depId) { console.error("bc_config.json 의 statsUrl 형식 이상"); process.exit(1); }
const post = async body => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), redirect: "follow" }); return r.json(); };
const admin = q => { const key = fs.readFileSync(path.join(sdir, ".admin_key"), "utf8").trim(); return post({ admin: { key, q } }); };
const day = t => t ? new Date(t).toISOString().slice(0, 16).replace("T", " ") + "Z" : "-";

const check = async () => {
  let bad = 0;
  for (const [q, f] of [["", j => "층 " + Object.keys(j.floors || {}).length], ["?a=gal", j => "ok " + j.ok + " · 던전 " + (j.levels || []).length], ["?a=rank", j => "ok " + j.ok + " · 랭킹 " + (j.champ || []).length]]) {
    try { const r = await fetch(url + q + (q ? "&" : "?") + "t=" + Date.now(), { redirect: "follow" }); console.log((q || "(통계)").padEnd(8), r.status, f(await r.json())); if (!r.ok) bad++; }
    catch (e) { bad++; console.log(q || "(통계)", "오류", e.message); }
  }
  // 존재하지 않는 기기로 제작자 이름 변경 → v3.4 이상이면 {ok:1,n:0}. 아무것도 바뀌지 않음.
  const p = await post({ dev: "deploycheck_none", gal: { op: "rename", author: "check" } }).catch(e => ({ err: e.message }));
  console.log("v3.4 기능".padEnd(8), JSON.stringify(p), p.ok === 1 ? "정상" : "구버전 또는 오류");
  if (fs.existsSync(path.join(sdir, ".admin_key"))) {
    const a = await admin("summary").catch(e => ({ err: e.message }));
    console.log("관리자 조회".padEnd(8), a.ok === 1 ? "정상 · 서버 버전 " + a.v : "불가 " + JSON.stringify(a).slice(0, 80));
    if (a.ok !== 1) bad++;
  }
  return bad;
};

const main = async () => {
  const cmd = process.argv[2] || "check";
  if (cmd === "check") process.exit((await check()) ? 1 : 0);
  if (cmd === "summary") {
    const a = await admin("summary"); if (a.ok !== 1) { console.log(JSON.stringify(a)); process.exit(1); }
    console.log("서버 버전", a.v, "·", day(a.now));
    for (const [k, v] of Object.entries(a.sheets)) console.log(k.padEnd(12), Object.entries(v).map(([x, y]) => x + "=" + (x === "lastT" ? day(y) : typeof y === "object" ? JSON.stringify(y) : y)).join("  "));
    return;
  }
  if (cmd === "floors") {
    const a = await admin("floors"); if (a.ok !== 1) { console.log(JSON.stringify(a)); process.exit(1); }
    const fl = a.floors, ks = Object.keys(fl).map(Number).sort((x, y) => x - y), ns = ks.map(k => fl[k].n);
    console.log("기록", a.rows, "건 · 층", ks.length, "개 · 층당 기기 수 최소", Math.min(...ns), "최대", Math.max(...ns), "· 20대 이상인 층", ns.filter(n => n >= 20).length, "개");
    if (process.argv[3] === "all") for (const k of ks) console.log(String(k).padStart(3) + "층", "기기", String(fl[k].n).padStart(3), "★1/2/3", fl[k].s.join("/"), "최소", fl[k].m[0], "수 목록", fl[k].m.slice(0, 12).join(","));
    else console.log("(층별 상세: node tools/server.js floors all)");
    return;
  }
  if (cmd === "gallery") {
    const a = await admin("gallery"); if (a.ok !== 1) { console.log(JSON.stringify(a)); process.exit(1); }
    for (const l of a.levels) console.log(l.status.padEnd(8), l.id, "신고", l.reports, "플레이", l.plays, "추천", l.likes, "|", l.name, "/", l.author);
    console.log("총", a.levels.length, "개"); return;
  }
  if (cmd === "rankdel" || cmd === "userdel") {
    const key = fs.readFileSync(path.join(sdir, ".admin_key"), "utf8").trim(), v = process.argv[3];
    if (!v) { console.error("대상이 필요합니다"); process.exit(1); }
    const body = cmd === "rankdel" ? { key, q: "rankdel", name: v, ...(process.argv[4] ? { floor: Number(process.argv[4]) } : {}) } : { key, q: "userdel", n: Number(v) };
    const r = await post({ admin: body }); console.log(JSON.stringify(r)); process.exit(r.ok === 1 ? 0 : 1);
  }
  if (cmd === "deploy") {
    const desc = process.argv[3]; if (!desc) { console.error('설명이 필요합니다: node tools/server.js deploy "v3.5 관리자 조회"'); process.exit(1); }
    const code = path.join(sdir, "Code.js"), tmp = path.join(require("os").tmpdir(), "bc_server_check.js");
    fs.copyFileSync(code, tmp);
    if (cp.spawnSync(process.execPath, ["--check", tmp], { stdio: "inherit" }).status !== 0) { console.error("문법 오류 — 배포 중단"); process.exit(1); }
    // Windows에서는 npx가 .cmd라 셸을 거쳐야 함 → 명령을 한 줄로 만들고, 설명은 안전한 글자만 남김
    const run = args => { const r = cp.spawnSync("npx clasp " + args.join(" "), { cwd: sdir, encoding: "utf8", shell: true }); const out = (r.stdout || "") + (r.stderr || ""); console.log(out.trim().replace(/AKfycb[\w-]{12}[\w-]+/g, m => m.slice(0, 18) + "…")); if (r.status !== 0) { console.error("clasp " + args[0] + " 실패 — 배포 중단"); process.exit(1); } return out; };
    run(["push", "-f"]);
    run(["deploy", "-i", depId, "-d", '"' + desc.replace(/[^\w .\-가-힣]/g, "").slice(0, 60) + '"']);
    console.log("— 배포 후 확인 —");
    process.exit((await check()) ? 1 : 0);
  }
  console.error("모르는 명령: " + cmd); process.exit(1);
};
main().catch(e => { console.error(String(e)); process.exit(1); });
