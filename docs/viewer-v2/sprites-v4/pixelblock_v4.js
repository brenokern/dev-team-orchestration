/* ================= pixel art — assets do pixel-agents (pack JIK-A-4 "Metro City") =================
   Os sprites abaixo sao os MESMOS PNGs do pixel-agents (webview-ui/public/assets), convertidos
   pixel a pixel para linhas de texto + paleta — identicos ao que o Breno ve no VS Code.
   6 personagens (char_0..5): quadros stand (frente), walk0-2 (lateral), type0-1 e read0-1 (de
   costas, sentado). Mobilia: DESK_FRONT (48x32), PC_FRONT_ON_1..3 + OFF (16x32),
   CUSHIONED_CHAIR_BACK (16x16). Creditos: JIK-A-4 (itch.io) via pixel-agents (MIT). */
__V4DATA__
const SPX=2;                       /* 1 pixel de sprite = 2px de tela (zoom base do pack) */
const SPR_W=16*SPX,SPR_H=32*SPX;
function pix(rows,pal,px,W,flip){
  let r="";
  rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=row[x];if(c===".")continue;
    const f=pal[c];if(!f)continue;
    r+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${f}"/>`;}});
  return `<svg class="sp" width="${W*px}" height="${rows.length*px}" viewBox="0 0 ${W} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true"${flip?' style="transform:scaleX(-1)"':''}>${r}</svg>`;
}
/* papel -> personagem do pack. Sao 6 sheets para 10 papeis: os 4 extras reusam um sheet com
   a ROUPA deslocada em matiz (pele e cabelo preservados), como o proprio pixel-agents faz. */
const CAST={
  "backend-intern":[0,0],"frontend-intern":[1,0],"data-intern":[2,0],"leader":[3,0],
  "reviewer-intern":[4,0],"qa-intern":[5,0],
  "ai-intern":[0,150],"infra-intern":[2,200],"ux-intern":[5,250],"pr-writer-intern":[1,120]};
function castOf(role){
  if(CAST[role])return CAST[role];
  let h=0;for(const c of role)h=(h*31+c.charCodeAt(0))>>>0;
  return [h%PA.chars.length,40+(h%7)*45];
}
function hueShift(hex,deg){
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;
  if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}
  if(s<.12)return hex; /* cinzas/brancos nao mudam */
  h=(h+deg/360)%1;
  const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};
  const to=v=>Math.round(v*255).toString(16).padStart(2,"0");
  return "#"+to(f(h+1/3))+to(f(h))+to(f(h-1/3));
}
const palCache={};
function paletteOf(role){
  if(palCache[role])return palCache[role];
  const [i,deg]=castOf(role),ch=PA.chars[i];
  let pal=ch.pal;
  if(deg){pal={};const skin=new Set(ch.skin);
    for(const k in ch.pal)pal[k]=skin.has(k)?ch.pal[k]:hueShift(ch.pal[k],deg);}
  return palCache[role]={i,pal};
}
/* cor do papel (roster, badge, arestas): a camisa do personagem, para bater com o boneco */
function colorOf(role){
  const {i,pal}=paletteOf(role);
  const rows=PA.chars[i].frames.stand;const cnt={};
  for(let y=14;y<22;y++)for(const c of rows[y])if(c!==".")cnt[c]=(cnt[c]||0)+1;
  const k=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
  const c=k?pal[k]:"#888";return {h:c,a:c};
}
const LEADER={id:"leader",h:"#34d399",a:"#34d399"};
const A=role=>role==="leader"?LEADER:{id:role,...colorOf(role)};
/* pose do viewer -> quadro. sit/sitback (legado) = de costas no PC */
const FRAME={stand:"stand",walk0:"walk0",walk1:"walk1",walk2:"walk2",sit:"type0",sitback:"type0",
  type0:"type0",type1:"type1",read0:"read0",read1:"read1"};
function sprite(a,pose,mood,px,flip){
  const {i,pal}=paletteOf(a.id);
  const rows=PA.chars[i].frames[FRAME[pose]||"stand"];
  return pix(rows,pal,px,16,flip);
}
/* ---- estacao de trabalho: a geometria do pixel-agents, em pixels de sprite ----
   mesa (0,0) 48x32 · PC (16,0) 16x32 em cima da mesa · cadeira (16,32) 16x16 ·
   personagem sentado em (16, 32+16+6-32 = 22): cabeca sobre a borda de baixo da mesa,
   tronco coberto pelo encosto (z acima). CHARACTER_SITTING_OFFSET_PX=6 e deles. */
const DESK_W=48*SPX,DESK_H=32*SPX,STATION_H=54*SPX;
const PC_DX=16*SPX,PC_DY=0,CHAIR_DX=16*SPX,CHAIR_DY=32*SPX,SIT_DX=16*SPX,SIT_DY=22*SPX;
const deskSvg=()=>pix(PA.furn.desk.rows,PA.furn.desk.pal,SPX,48);
const chairSvg=()=>pix(PA.furn.chair.rows,PA.furn.chair.pal,SPX,16);
const pcSvg=f=>pix(PA.furn.pc.frames[f],PA.furn.pc.pal,SPX,16);
/* telas dos PCs: acesas e animadas onde tem gente, apagadas onde nao tem. Um so ticker. */
const PCS=new Set();let pcFrame=0;
function mkPc(){const e=document.createElement("div");e.className="pc";e.innerHTML=pcSvg("off");e._on=false;PCS.add(e);return e;}
function pcOn(e,on){if(!e||e._on===on)return;e._on=on;e.innerHTML=pcSvg(on?"pc0":"off");}
setInterval(()=>{if(document.hidden)return;pcFrame=(pcFrame+1)%3;
  for(const e of PCS)if(e._on&&e.isConnected)e.innerHTML=pcSvg("pc"+pcFrame);},420);
