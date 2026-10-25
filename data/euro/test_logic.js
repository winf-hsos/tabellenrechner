const fs=require("fs");
const src=fs.readFileSync(__dirname+"/logic.js","utf8");
const pre=`
function mulberry32(a){return function(){a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(arr,rnd){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const LEAGUE_IDS=["bl1"];
function computeTable(teams,fixtures,results){return [];}
`;
eval(pre+src+`
let okColor=0, N=300, same=0, maxDe=0, bad=0;
for(let seed=1;seed<=N;seed++){
  const teams=euroStartTeams("cl").map(t=>({...t}));
  const t0=Date.now();
  const fx=euroDraw(teams, seed*7919);
  // checks
  const cnt=new Array(36).fill(0), home=new Array(36).fill(0), opp=Array.from({length:36},()=>new Set());
  let perMdOk=true, gamesN=0;
  fx.forEach(md=>{ const seen=new Set(); md.forEach(([h,a])=>{ gamesN++; if(seen.has(h)||seen.has(a)) perMdOk=false; seen.add(h);seen.add(a); cnt[h]++;cnt[a]++;home[h]++; opp[h].add(a);opp[a].add(h);}); });
  const allEight=cnt.every(c=>c===8), homes=home.every(c=>c===4), distinct=opp.every(s=>s.size===8);
  if(perMdOk && fx.every(m=>m.length===18)) okColor++;
  if(!(allEight&&homes&&distinct&&gamesN===144)) bad++;
  // pots: 2 per pot
  const order=teams.map((_,i)=>i).sort((a,b)=>teams[b].strength-teams[a].strength||a-b);
  const potOf={}; order.forEach((i,k)=>potOf[i]=Math.floor(k/9));
  let potsOk=true; for(let i=0;i<36;i++){ const c=[0,0,0,0]; opp[i].forEach(o=>c[potOf[o]]++); if(!c.every(x=>x===2)) potsOk=false; } if(!potsOk) bad++;
  let de=0; fx.forEach(md=>md.forEach(([h,a])=>{ if(teams[h].de&&teams[a].de) de++; })); maxDe=Math.max(maxDe,de);
}
console.log("Spieltage sauber:",okColor+"/"+N,"| Strukturfehler:",bad,"| max. deutsche Duelle:",maxDe);
`);
