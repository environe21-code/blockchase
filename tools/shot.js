// 사용: node tools/shot.js [test.html] [출력 폴더=test-results]
// test.html = index.html에서 <script type="module" crossorigin> 을 <script> 로 바꾼 사본
// 홈(10초 대기) → "던전 추격" 클릭 → 캠페인 맵 스크린샷. 외부 요청은 모두 차단(라이브 서버 통계 오염 방지).
const path=require("path"),fs=require("fs");const {chromium}=require("playwright");
const html=path.resolve(process.argv[2]||"test.html"),out=path.resolve(process.argv[3]||"test-results");
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:"ko-KR"});
 const errs=[];page.on("pageerror",e=>errs.push(e.message));
 await page.route(u=>!u.href.startsWith("file:"),r=>r.abort());
 await page.goto("file:///"+html.replace(/\\/g,"/"));
 await page.waitForTimeout(10000);
 await page.screenshot({path:path.join(out,"home.png")});console.log("saved",path.join(out,"home.png"));
 const btn=page.getByText("던전 추격",{exact:true}).first();
 if(await btn.isVisible().catch(()=>false)){
  await btn.click();await page.waitForTimeout(4000);
  await page.screenshot({path:path.join(out,"campaign.png")});console.log("saved",path.join(out,"campaign.png"));
 }else console.log("'던전 추격' 버튼을 찾지 못함 — 캠페인 맵 생략");
 if(errs.length)console.log("page errors:",errs.slice(0,5));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
