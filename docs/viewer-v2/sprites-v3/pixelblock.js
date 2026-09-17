/* ================= pixel art v3 — estilo Metro City / pixel-agents =================
   16x32 em vista 3/4, sem contorno preto, 3 tons por material. Dados em V3 (poses por
   variante de cabelo), V3PAL (materiais), V3ROLES (papel -> cabelo, pele, camisa, calca).
   O contrato continua sprite(a,pose,mood,px,flip): 'mood' e ignorado — ninguem mais fica
   triste no sofa; quem nao esta no fluxo trabalha na sua baia. */
__V3DATA__
const SPX=3;                       /* escala do pixel: 16x32 -> 48x96 na tela */
const SPR_W=16*SPX,SPR_H=32*SPX;
/* pixels -> <rect>. Materiais que seguem o TEMA (contorno/roupa dos sprites antigos)
   sumiram: aqui cada material tem cor propria, como no pack. */
function pix(rows,pal,px,W,flip){
  let r="";
  rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=row[x];if(c===".")continue;
    const f=pal[c];if(!f)continue;
    r+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${f}"/>`;}});
  return `<svg class="sp" width="${W*px}" height="${rows.length*px}" viewBox="0 0 ${W} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true"${flip?' style="transform:scaleX(-1)"':''}>${r}</svg>`;
}
/* paleta de um papel: papel conhecido usa a tabela; papel novo (roster extra) sorteia
   variantes pelo hash do nome — deterministico, sem repetir a cada carga */
const HAIRS=Object.keys(V3);
function styleOf(role){
  if(V3ROLES[role])return V3ROLES[role];
  let h=0;for(const c of role)h=(h*31+c.charCodeAt(0))>>>0;
  const pick=(o,k)=>{const ks=Object.keys(o);return ks[k%ks.length];};
  return [HAIRS[h%HAIRS.length],pick(V3PAL.hair,h>>2),pick(V3PAL.skin,h>>4),pick(V3PAL.shirt,h>>6),pick(V3PAL.pants,h>>8)];
}
function paletteOf(role,accent){
  const [hair,hc,sk,sh,pt]=styleOf(role);
  const H=V3PAL.hair[hc],S=V3PAL.skin[sk],B=V3PAL.shirt[sh],P=V3PAL.pants[pt];
  return {hair,pal:{h:H[0],H:H[1],"+":H[2],s:S[1],S:S[0],E:"#1a1a1f",b:B[0],B:B[1],"^":B[2],
    p:P[0],P:P[1],D:V3PAL.shoe,A:accent,_:"rgba(0,0,0,.28)"}};
}
/* cordao do cracha: a cor do papel, dessaturada — e o unico lugar onde o papel aparece no corpo */
const KNOWN_ACC={"data-intern":"hsl(200 30% 58%)","backend-intern":"hsl(262 30% 60%)","ai-intern":"hsl(170 30% 50%)",
  "frontend-intern":"hsl(330 30% 60%)","infra-intern":"hsl(30 35% 55%)","qa-intern":"hsl(45 40% 55%)",
  "ux-intern":"hsl(300 25% 60%)","reviewer-intern":"hsl(210 20% 62%)","pr-writer-intern":"hsl(90 25% 55%)"};
function colorOf(role){
  if(KNOWN_ACC[role])return {h:KNOWN_ACC[role],a:KNOWN_ACC[role]};
  let h=0;for(const c of role)h=(h*31+c.charCodeAt(0))%360;
  return {h:`hsl(${h} 30% 58%)`,a:`hsl(${h} 30% 58%)`};
}
const LEADER={id:"leader",h:"#34d399",a:"#34d399"};
const A=role=>role==="leader"?LEADER:{id:role,...colorOf(role)};
/* pose do viewer -> quadro do sprite. sit/sitback (legado) = de costas no PC */
const FRAME={stand:"stand",walk0:"walk0",walk1:"walk1",walk2:"walk2",sit:"type0",sitback:"type0",type0:"type0",type1:"type1"};
function sprite(a,pose,mood,px,flip){
  const {hair,pal}=paletteOf(a.id,a.a);
  const rows=(V3[hair]||V3.short)[FRAME[pose]||"stand"];
  return pix(rows,pal,px,16,flip);
}
/* mobilia no mesmo estilo: mesa com monitor (28x28) e encosto da cadeira (14x6).
   GEOMETRIA (em pixels de sprite, SPX cada): o personagem sentado tem os ombros
   (linha 13) na frente da mesa (linha 21) => topo do personagem = topo da mesa + 8 linhas;
   o encosto cobre as linhas 21-26 do personagem (quadril). Tudo deriva de DESK(). */
const DESK_W=28*SPX,DESK_H=28*SPX;
const deskSvg=()=>pix(DESK_ROWS,FURN_PAL,SPX,28);
const chairSvg=()=>pix(CHAIR_ROWS,FURN_PAL,SPX,14);
const SIT_DX=(DESK_W-SPR_W)/2,SIT_DY=8*SPX;          /* personagem relativo a mesa */
const CHAIR_DX=SIT_DX+(SPR_W-14*SPX)/2,CHAIR_DY=SIT_DY+21*SPX; /* encosto relativo a mesa */
