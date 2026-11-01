const fs=require("fs");const {JSDOM,VirtualConsole}=require("jsdom");
const html=fs.readFileSync("rel1720_test.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://environe21-code.github.io/blockchase/index.html",virtualConsole:new VirtualConsole(),beforeParse(w){
 w.fetch=()=>Promise.resolve({ok:false,status:404,json:()=>Promise.resolve({}),text:()=>Promise.resolve("")});
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
 w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},clearRect(){},drawImage(){},getImageData:()=>({data:[]}),putImageData(){},createImageData:()=>[],setTransform(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},arc(){},translate(){},scale(){},rotate(){},measureText:()=>({width:0}),fillText(){}});
 w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.scrollTo=()=>{};w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
 Object.defineProperty(w.navigator,"serviceWorker",{get:()=>({getRegistrations:()=>Promise.resolve([]),register:()=>Promise.resolve({}),addEventListener(){}})});
}});
const w=dom.window;
// 보드 추출 함수(브라우저 컨텍스트)
const GEN=`(p)=>{const M=Xt[p];vt=bcRows(p+1);const R2=bh(M,ss(As(bcSeedOf(p))));bcCellFix(p+1,R2.grid);return JSON.stringify({grid:R2.grid.map(row=>row.map(c=>!c?null:{k:c.kind,color:c.color,dir:c.dir||null,open:!!c.open})),empty:R2.empty,villain:R2.villain,villain2:R2.villain2||null,special:M.special,mission:M.mission,rows:vt})}`;
function analyze(b){
 const g=b.grid,Rn=g.length,Cn=g[0].length;const isStone=(r,c)=>g[r][c]&&g[r][c].k==="stone";const inb=(r,c)=>r>=0&&r<Rn&&c>=0&&c<Cn;
 // 빈칸 도달 가능 집합(돌벽 제외 4연결)
 const reach=new Set();const q=[[b.empty.r,b.empty.c]];reach.add(b.empty.r+","+b.empty.c);
 while(q.length){const [r,c]=q.shift();for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const nr=r+dr,nc=c+dc;if(!inb(nr,nc)||isStone(nr,nc))continue;const k=nr+","+nc;if(!reach.has(k)){reach.add(k);q.push([nr,nc])}}}
 const dead=[];
 for(let r=0;r<Rn;r++)for(let c=0;c<Cn;c++){const cell=g[r][c];if(!cell||cell.k==="stone")continue;if(r===b.empty.r&&c===b.empty.c)continue;
  const dir=cell.dir;const axes=dir==="left"||dir==="right"||dir==="h"?["h"]:dir==="up"||dir==="down"||dir==="v"?["v"]:["h","v"];
  let ok=false;
  for(const ax of axes){const dirs=ax==="h"?[[0,1],[0,-1]]:[[1,0],[-1,0]];for(const [dr,dc] of dirs){let nr=r+dr,nc=c+dc;while(inb(nr,nc)&&!isStone(nr,nc)){if(reach.has(nr+","+nc)){ok=true;break}nr+=dr;nc+=dc}if(ok)break}if(ok)break}
  if(!ok)dead.push({r,c,k:cell.k,color:cell.color,dir:cell.dir})}
 return {dead,reach};
}
setTimeout(()=>{
 const gen=w.eval(GEN);const out={};let total=0;
 for(let p=0;p<200;p++){const b=JSON.parse(gen(p));const {dead}=analyze(b);if(dead.length){out[p+1]=dead;total+=dead.length}}
 console.log("floors with dead cells:",Object.keys(out).length,"| total dead cells:",total);
 console.log(Object.entries(out).map(([f,d])=>f+":"+d.map(x=>"("+x.r+","+x.c+")"+(x.dir?x.dir[0]:"")).join("")).join("  "));
 fs.writeFileSync("dead_report.json",JSON.stringify(out));
 const userList=[157,149,148,143,142,126,119,116,114,113,105,89,88,87,84,83,78,71,62,56,54,38,39,36,27];
 console.log("user-listed but NOT flagged:",userList.filter(f=>!out[f]).join(","));
 process.exit(0);
},9000);
