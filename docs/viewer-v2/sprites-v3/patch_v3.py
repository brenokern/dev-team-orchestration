#!/usr/bin/env python3
"""Aplica os personagens v3 (estilo pixel-agents) + baias ao viewer/index.html. Idempotente por assert."""
import sys,os
here=os.path.dirname(os.path.abspath(__file__))
p=sys.argv[1]
s=open(p,encoding="utf-8").read()
block=open(os.path.join(here,"pixelblock.js")).read().replace("__V3DATA__",open(os.path.join(here,"v3data.js")).read().rstrip())
a=s.index("/* ================= pixel art ================= */"); b=s.index("/* ================= layout from plan ================= */")
s=s[:a]+block+"\n"+s[b:]
def rep(old,new,n=1):
    global s
    assert old in s, "nao achei: "+old[:70]
    s=s.replace(old,new,n)
rep('''const DESK=s=>({x:s.x-33,y:s.y+CARD_H/2-5});
const SEAT=s=>({x:s.x-18,y:s.y+CARD_H/2+25});
const WAIT=s=>({x:s.x-104,y:s.y+CARD_H/2-11});''',
'''const DESK=s=>({x:s.x-DESK_W/2,y:s.y+CARD_H/2-2});
const SEAT=s=>{const d=DESK(s);return {x:d.x+SIT_DX,y:d.y+SIT_DY};};   /* deriva da MESA: sentar nunca desalinha */
const CHAIR=s=>{const d=DESK(s);return {x:d.x+CHAIR_DX,y:d.y+CHAIR_DY};};
const WAIT=s=>{const d=DESK(s);return {x:d.x-SPR_W-14,y:d.y-16};};''')
rep("const CARD_W=176,COLW=240,X0=620,MIDY=340,ROWGAP=232;","const CARD_W=176,COLW=240,X0=620,MIDY=340,ROWGAP=252;")
a=s.index("const LOUNGE={tv:"); b=s.index("/* ================= DOM refs / shared state")
s=s[:a]+'''/* BAIAS: quem nao esta no fluxo trabalha na sua baia (3x3, canto esquerdo), de costas,
   teclando devagar — meio AFK. Cada papel tem baia fixa (ordem do roster), entao ninguem
   disputa lugar e voltar da mesa e sempre para o mesmo ponto. */
const BAY_COLS=3,BAY_DX=DESK_W+22,BAY_DY=DESK_H+26;
const BAY_ORIGIN={x:70,y:MIDY-Math.floor(BAY_DY*1.5)+10};
const BAYPOS=i=>({x:BAY_ORIGIN.x+(i%BAY_COLS)*BAY_DX,y:BAY_ORIGIN.y+Math.floor(i/BAY_COLS)*BAY_DY});
const BAY_ROLES=["data-intern","backend-intern","ai-intern","frontend-intern","infra-intern",
                 "qa-intern","ux-intern","reviewer-intern","pr-writer-intern"];
let bayExtra=0;const bayIdx={};
function bayOf(role){
  if(role in bayIdx)return bayIdx[role];
  const i=BAY_ROLES.indexOf(role);
  bayIdx[role]=i>=0?i:BAY_ROLES.length+(bayExtra++);
  return bayIdx[role];
}
const BAYSEAT=role=>{const p=BAYPOS(bayOf(role));return {x:p.x+SIT_DX,y:p.y+SIT_DY};};
function loungeY(){}

'''+s[b:]
rep('''function setPose(t,pose){t.pose=pose;
  t.holder.innerHTML=sprite(A(t.ag),pose,t.mood,3,t.flip);}
function stopMove(t){if(t._iv){clearInterval(t._iv);t._iv=null;}
  gsap.killTweensOf(t.el,"left,top,y");} /* so movimento — nunca mate o fade de opacidade */''',
'''/* quadro sentado: 'sitback' = trabalhando (tecla continuo, 300ms como no pixel-agents);
   'sit' = na baia, AFK (rajadas de 2-4s teclando, pausas de 3-7s). Qualquer outra pose
   para o teclado. Um unico timer por personagem — nunca dois loops brigando. */
function stopType(t){if(t._ty){clearTimeout(t._ty);t._ty=null;}}
function frame(t,f){t.holder.innerHTML=sprite(A(t.ag),f,t.mood,SPX,t.flip);}
function startType(t,afk){
  stopType(t);let f=0;
  const tick=()=>{
    if(t.pose!=="sitback"&&t.pose!=="sit"){t._ty=null;return;}
    if(document.hidden){t._ty=setTimeout(tick,1000);return;}
    f=1-f;frame(t,"type"+f);
    let d=afk?520:300;
    /* AFK: a cada rajada, chance de pausar com as maos na mesa */
    if(afk&&f===0&&Math.random()<.35){frame(t,"type0");d=3000+Math.random()*4000;}
    t._ty=setTimeout(tick,d);
  };
  t._ty=setTimeout(tick,afk?800+Math.random()*1500:300);
}
function setPose(t,pose){t.pose=pose;
  if(pose==="sitback"||pose==="sit")gsap.set(t.el,{y:0}); /* resto de bob() abriria um vao ate o encosto */
  frame(t,pose);
  if(pose==="sitback")startType(t,false);
  else if(pose==="sit")startType(t,true);
  else stopType(t);}
function stopMove(t){if(t._iv){clearInterval(t._iv);t._iv=null;}
  gsap.killTweensOf(t.el,"left,top,y");} /* so movimento — nunca mate o fade de opacidade */''')
rep('''  stopMove(t);gsap.set(el,{y:0});t.flip=x<cx;
  let f=0,intr=false;setPose(t,"walk0");
  const iv=setInterval(()=>{f=1-f;setPose(t,"walk"+f);},150);t._iv=iv;''',
'''  stopMove(t);gsap.set(el,{y:0});t.flip=x<cx;
  /* ciclo de 4 quadros com 3 desenhos (0-1-2-1), como no pack: o passo "neutro" no meio */
  const CYC=[0,1,2,1];let f=0,intr=false;setPose(t,"walk0");
  const iv=setInterval(()=>{f=(f+1)%4;setPose(t,"walk"+CYC[f]);},150);t._iv=iv;''')
rep('''  await gsap.to(el,{left:x,top:y,duration:d/(speed||150),ease:"none",''','''  await gsap.to(el,{left:x,top:y,duration:d/(speed||190),ease:"none",''')
rep('''async function sitCouch(t){
  const p=LOUNGE.seat(seatN++);p.y=LOUNGE._seatY;
  await walk(t,p.x,p.y);stopMove(t);gsap.set(t.el,{y:0});
  t.el.style.zIndex=5;t.flip=true;setPose(t,"sit");
}''',
'''/* volta pra baia: caminha ate o assento da PROPRIA baia e senta de costas (AFK).
   Assento deriva da mesa da baia — mesma geometria de sentar da mesa do passo. */
async function sitCouch(t){
  const p=BAYSEAT(t.ag);
  await walk(t,p.x,p.y);stopMove(t);gsap.set(t.el,{y:0});
  t.flip=false;setPose(t,"sit");
}
const sitBay=sitCouch;''')
rep('''      await walk(L,s.x+46,SEAT(s).y+2);if(cur.step!==s)continue;
      await sleep(700);if(cur.step!==s)continue;
      await walk(L,s.x+98,SEAT(s).y+2,110);if(cur.step!==s)continue;''',
'''      await walk(L,DESK(s).x+DESK_W+6,DESK(s).y-8);if(cur.step!==s)continue;
      await sleep(700);if(cur.step!==s)continue;
      await walk(L,DESK(s).x+DESK_W+52,DESK(s).y-8,110);if(cur.step!==s)continue;''')
rep('''  await walk(L,LOUNGE.seat(Math.min(seatN,8)).x+40,LOUNGE._seatY+6);''',
    '''  await walk(L,BAY_ORIGIN.x+BAY_COLS*BAY_DX+8,BAY_ORIGIN.y+BAY_DY-20);''')
rep('''    d.innerHTML=`<div class="fshadow" style="left:-4px;top:42px;width:76px;height:11px"></div>`+deskSvg();
    stage.appendChild(d);deskEl[s.id]=d;});''',
'''    d.innerHTML=deskSvg();
    stage.appendChild(d);deskEl[s.id]=d;
    /* encosto da cadeira: fica NA FRENTE do personagem (cobre o quadril) — e o que
       faz "sentar" ler como sentar, em vez de um boneco em pe colado na mesa */
    const c=document.createElement("div");c.className="furn chair";
    c.style.left=CHAIR(s).x+"px";c.style.top=CHAIR(s).y+"px";c.style.opacity=0;
    c.innerHTML=chairSvg();stage.appendChild(c);d._chair=c;});''')
a=s.index("  /* lounge */"); b=s.index("  /* roster: SEMPRE os 9 papeis do time")
s=s[:a]+'''  /* baias: piso discreto + 9 mesas em 3x3 (+ extras do roster, se houver) */
  const nb=Math.max(BAY_ROLES.length,Object.keys(bayIdx).length);
  const rows=Math.ceil(nb/BAY_COLS);
  const floor=document.createElement("div");floor.className="furn";
  floor.style.cssText=`left:${BAY_ORIGIN.x-22}px;top:${BAY_ORIGIN.y-18}px;width:${BAY_COLS*BAY_DX+22}px;height:${rows*BAY_DY+18}px;z-index:1;
    background:var(--shell);border:1px solid var(--hair-soft);border-radius:14px`;
  stage.appendChild(floor);
  for(let i=0;i<nb;i++){const p=BAYPOS(i);
    const d=document.createElement("div");d.className="furn";d.style.left=p.x+"px";d.style.top=p.y+"px";d.innerHTML=deskSvg();stage.appendChild(d);
    const c=document.createElement("div");c.className="furn chair";c.style.left=(p.x+CHAIR_DX)+"px";c.style.top=(p.y+CHAIR_DY)+"px";c.innerHTML=chairSvg();stage.appendChild(c);}
'''+s[b:]
rep('''    if(!used){r.classList.add("out");
      r.querySelector(".rsp").innerHTML=sprite(a,"sit","sad",1.6);
      r.querySelector(".rs").textContent=t("natv");
      const tk=mkTok(role,LOUNGE.seat(seatN).x,LOUNGE._seatY,"sad");
      seatN++;tk.flip=true;setPose(tk,"sit");tk.el.style.zIndex=5;}''',
'''    if(!used){r.classList.add("out");
      r.querySelector(".rsp").innerHTML=sprite(a,"sit","ok",1.1);
      r.querySelector(".rs").textContent=t("natv");}
    /* TODO MUNDO comeca na propria baia; quem entra no fluxo caminha dali ate a mesa */
    const bp=BAYSEAT(role);const tk=mkTok(role,bp.x,bp.y,"ok");setPose(tk,"sit");''')
rep('''    if(deskEl[s.id])gsap.to(deskEl[s.id],{opacity:1,duration:dur,delay:liveMode?i*.07:0});});''',
'''    if(deskEl[s.id]){gsap.to(deskEl[s.id],{opacity:1,duration:dur,delay:liveMode?i*.07:0});
      if(deskEl[s.id]._chair)gsap.to(deskEl[s.id]._chair,{opacity:1,duration:dur,delay:liveMode?i*.07:0});}});''')
rep('''  if(!toks.leader){const L=mkTok("leader",260,LOUNGE._seatY-10,"ok",true);''',
    '''  if(!toks.leader){const L=mkTok("leader",BAY_ORIGIN.x+BAY_COLS*BAY_DX+8,BAY_ORIGIN.y+BAY_DY-20,"ok",true);''')
s=s.replace('''<div class="rsp">${sprite(a,"stand","ok",1.6)}</div>''','''<div class="rsp">${sprite(a,"stand","ok",1.1)}</div>''')
rep('''  const t=mkTok(role,LOUNGE.couch.x+60,LOUNGE._seatY,"ok");''',
    '''  const bp=BAYSEAT(role);const t=mkTok(role,bp.x,bp.y,"ok");setPose(t,"sit");''')
rep('''        const d=deskEl[s.id];
        if(d){d.style.left=DESK(s).x+"px";d.style.top=DESK(s).y+"px";}});''',
'''        const d=deskEl[s.id];
        if(d){d.style.left=DESK(s).x+"px";d.style.top=DESK(s).y+"px";
          if(d._chair){d._chair.style.left=CHAIR(s).x+"px";d._chair.style.top=CHAIR(s).y+"px";}}});''')
rep('''  const x=parseFloat(t.el.style.left)+18,y=parseFloat(t.el.style.top)-14;''',
    '''  const x=parseFloat(t.el.style.left)+SPR_W/2,y=parseFloat(t.el.style.top)-10;''')
rep('''  toks={};seatN=0;doneN=0;dynN=0;lastDynX=-1e9;lastDone=null;''',
    '''  Object.values(toks).forEach(t=>{stopType(t);stopMove(t);});
  toks={};seatN=0;doneN=0;dynN=0;lastDynX=-1e9;lastDone=null;''')
rep('''.tok .hold-sp::after{content:"";position:absolute;left:50%;bottom:-2px;width:30px;height:7px;
  transform:translateX(-50%);border-radius:50%;z-index:-1;
  background:radial-gradient(ellipse at center,var(--shad),transparent 68%)}
.tok .badge{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:2px;
  font-family:"Geist Mono",monospace;font-size:8px;letter-spacing:.06em;
  background:var(--live);color:var(--bg);border-radius:999px;padding:1px 6px;opacity:0;
  transition:opacity .4s var(--ease);white-space:nowrap}
.tok.busy .badge{opacity:1}
.tok.lead .badge{background:var(--txt);opacity:1}
.furn{position:absolute;z-index:2;pointer-events:none}''',
'''.tok .badge{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:-6px;
  font-family:"Geist Mono",monospace;font-size:8.5px;letter-spacing:.06em;
  color:var(--dim);opacity:0;transition:opacity .4s var(--ease);white-space:nowrap}
.tok.busy .badge{opacity:1;color:var(--live)}
.tok.lead .badge{opacity:1;color:var(--txt)}
.furn{position:absolute;z-index:2;pointer-events:none}
.furn.chair{z-index:7} /* encosto NA FRENTE do personagem sentado */''')
s=s.replace('natv:"na tv",','natv:"na baia",',1).replace('natv:"watching tv",','natv:"at their bay",',1)
open(p,"w",encoding="utf-8").write(s); print("patch v3 aplicado em",p)
