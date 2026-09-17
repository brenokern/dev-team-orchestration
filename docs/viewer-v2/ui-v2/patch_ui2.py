#!/usr/bin/env python3
"""Aplica a UI v2 (PROPOSTA.md §3: card com rail, cabeçalho com segmentado + menu,
stream agrupado por passo, Gantt em rails, palco com grade pontilhada, motion
respeitando prefers-reduced-motion) sobre o viewer/index.html da branch
design/viewer-v2 (personagens v4). Não muda a máquina de estado: só CSS, markup dos
cards e a forma de renderizar stream/Gantt. Cada substituição é exata e verificada.

uso: python3 patch_ui2.py viewer/index.html [saida.html]
"""
import sys, re

src = sys.argv[1]
dst = sys.argv[2] if len(sys.argv) > 2 else src
html = open(src, encoding="utf-8").read()

def rep(old, new, count=1):
    global html
    n = html.count(old)
    assert n == count, f"esperava {count}x, achei {n}x:\n{old[:120]}"
    html = html.replace(old, new)

def rep_between(start, end, new):
    """substitui do início de `start` até o fim de `end` (inclusive)."""
    global html
    i = html.index(start); j = html.index(end, i) + len(end)
    html = html[:i] + new + html[j:]

# ---------------------------------------------------------------- CSS: palco
rep_between(".mesh{position:fixed", "[data-theme=\"light\"] .grain{opacity:.018}",
"""/* palco: grade pontilhada discreta como referência de escala — sem orbs, sem grain, sem glow */
.stage{background-image:radial-gradient(var(--hair) 1px,transparent 1px);background-size:18px 18px}
/* movimento reduzido: rail parado, sem pulso; o JS teleporta em vez de caminhar */
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}}""")

# ---------------------------------------------------------------- CSS: chips -> cabeçalho v2
rep_between(".strip{flex:0 0 auto", ".strip .grow{flex:1}",
""".strip{flex:0 0 auto;padding:10px 14px;display:flex;align-items:center;gap:8px;
  border-bottom:1px solid var(--hair-soft);position:relative}
/* o que se LÊ: sessão · tokens · progresso — texto, não pílulas */
.chip{display:inline-flex;align-items:center;gap:7px;padding:6px 8px;
  font-family:"Geist Mono",monospace;font-size:10px;line-height:1;
  color:var(--dim);letter-spacing:.02em;cursor:default;white-space:nowrap}
.chip b{font-weight:500;color:var(--txt)}
.chip .d{width:6px;height:6px;border-radius:50%;background:var(--faint)}
.chip.ok .d{background:var(--live)}
.chip.warn .d{background:var(--hold)}
.chip.off{opacity:.55}
.chip.sep{color:var(--faint);padding:0}
/* o que se ESCOLHE VER: segmentado fluxo | gantt | runs */
.seg{display:inline-flex;background:var(--shell);border:1px solid var(--hair-soft);border-radius:9px;padding:2px;gap:2px}
.seg .chip.btn{border-radius:7px;padding:6px 11px;color:var(--dim);cursor:pointer;
  transition:background .3s var(--ease),color .3s var(--ease)}
.seg .chip.btn:hover{color:var(--txt)}
.seg .chip.btn.ok{background:var(--core-2);color:var(--txt);box-shadow:0 1px 2px var(--shad)}
/* botões soltos (colunas, menu) */
.chip.btn{cursor:pointer;border-radius:8px;color:var(--dim)}
.chip.btn:hover{background:var(--hair-soft);color:var(--txt)}
.chip.btn:active{transform:scale(.96)}
.chip.btn.icon{font-size:13px;padding:4px 8px}
/* menu ⋯ : o que raramente muda (som, tema, idioma) */
.menu{position:absolute;right:52px;top:calc(100% + 6px);z-index:30;display:none;flex-direction:column;gap:2px;
  min-width:150px;background:var(--core-2);border:1px solid var(--hair);border-radius:11px;padding:5px;
  box-shadow:0 10px 30px var(--shad)}
.menu.on{display:flex}
.menu .chip.btn{justify-content:space-between;padding:8px 10px;border-radius:7px}
.menu .chip.btn b{color:var(--dim);font-weight:400}
.menu .chip.btn.ok b{color:var(--txt)}
.strip .grow{flex:1}""")

# ---------------------------------------------------------------- CSS: arestas
rep(".edges path.past{stroke:var(--live-dim)} /* trajeto concluido fica verde */",
    ".edges path.past{stroke:var(--edge-past)} /* trajeto concluído fica em tinta; verde só leva ao ativo */")

# ---------------------------------------------------------------- CSS: card v2
rep_between(".node{position:absolute;width:176px;opacity:0}", ".node.humc.active .n-tm{opacity:1;color:var(--hold)}",
""".node{position:absolute;width:192px;opacity:0}
/* card v2: uma borda, um raio, e o RAIL como assinatura. Verde = só o que roda agora. */
.n-shell{transition:none}
.n-core{background:var(--core-2);border:1px solid var(--hair);border-radius:8px;padding:9px 11px 8px;
  position:relative;overflow:hidden;min-height:78px;display:flex;flex-direction:column;
  transition:border-color .6s var(--ease),background .6s var(--ease)}
.node.active .n-core{border-color:var(--live-dim)}
.node.done .n-core{border-color:var(--edge-past)}
/* linha 1: id · camada · estado */
.n-h{display:flex;align-items:center;gap:6px;font-family:"Geist Mono",monospace;font-size:10.5px;line-height:1;min-width:0}
.n-id{font-weight:500;color:var(--faint);transition:color .6s var(--ease)}
.node.active .n-id,.node.done .n-id{color:var(--txt)}
.n-lay{color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1;
  transition:color .6s var(--ease)}
.node.active .n-lay,.node.done .n-lay{color:var(--dim)}
.n-dot{width:6px;height:6px;border-radius:50%;background:var(--faint);flex:0 0 6px;transition:background .6s var(--ease)}
.node.active .n-dot{background:var(--live);animation:bl 1.15s ease-in-out infinite}
.node.done .n-dot{background:var(--txt);animation:none}
.node.humc .n-dot{background:var(--hold-dim)}
.node.humc.active .n-dot{background:var(--hold)}
.node.humc.done .n-dot{background:var(--txt)}
.n-subs{display:none;font-size:9px;color:var(--hold);border:1px solid var(--hold-dim);border-radius:999px;
  padding:1px 6px;cursor:pointer;line-height:1.2}
.n-subs.on{display:inline-block}
/* título: sans, nunca corta — o card cresce e todos os cards da run seguem o maior */
.n-t{font-size:12.5px;line-height:1.35;margin-top:6px;letter-spacing:-.01em;color:var(--dim);
  flex:1;transition:color .6s var(--ease)}
.node.active .n-t,.node.done .n-t{color:var(--txt)}
/* RAIL: a mesma barra do Gantt, deitada no card */
.n-rail{height:3px;border-radius:2px;background:var(--hair-soft);margin-top:8px;overflow:hidden;position:relative}
.n-rail i{position:absolute;inset:0;border-radius:2px;background:var(--hair);transform-origin:left;transform:scaleX(0);
  transition:transform .6s var(--ease),background .6s var(--ease)}
.node.active .n-rail i{transform:none;
  background:repeating-linear-gradient(90deg,var(--live) 0 8px,transparent 8px 14px);background-size:14px 3px;
  animation:railrun 1s linear infinite}
@keyframes railrun{to{background-position:14px 0}}
.node.done .n-rail i{transform:none;background:var(--txt);animation:none}
.node.humc .n-rail i{transform:none;background:repeating-linear-gradient(90deg,var(--hold-dim) 0 5px,transparent 5px 9px)}
.node.humc.active .n-rail i{background:repeating-linear-gradient(90deg,var(--hold) 0 8px,transparent 8px 14px);animation:railrun 1s linear infinite}
.node.humc.done .n-rail i{background:var(--txt);animation:none}
/* linha final: métricas (mono) · quem */
.n-f{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;
  font-family:"Geist Mono",monospace;font-size:10px;line-height:1;color:var(--faint)}
.n-tm{white-space:nowrap;color:var(--faint);transition:color .6s var(--ease)}
.node.active .n-tm{color:var(--live)}
.node.done .n-tm{color:var(--txt)}
.node.humc.active .n-tm{color:var(--hold)}
.n-who{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--faint);flex:0 1 auto;min-width:0}
.n-who:empty,.node.done .n-who{display:none} /* concluído: quem fez já está no roster/stream */
.n-check{position:absolute;top:7px;right:9px;width:14px;height:14px;border-radius:50%;
  background:var(--hair);display:grid;place-items:center;font-size:8px;color:var(--txt);
  opacity:0;transform:scale(.5)}
.node.done .n-check{background:var(--txt);color:var(--bg)}
.node.done .n-dot{display:none} /* o check ocupa o lugar do ponto */
/* card com veredito: inteiro clicável */
.node.hasnotes{cursor:pointer}
.node.hasnotes:hover .n-core{border-color:var(--edge-past)}
/* notificação de veredito do leader no card */
.n-note{position:absolute;top:-6px;right:-6px;width:12px;height:12px;border-radius:50%; /* centro no canto, sobressai */
  background:#e24b4a;border:1.5px solid var(--core-2);cursor:pointer;padding:0;z-index:3;
  pointer-events:auto;animation:notep 1.6s ease-in-out 3}
@keyframes notep{50%{transform:scale(1.35)}}
.n-note.read{background:var(--faint);animation:none}
/* dialog do veredito */
.dlgwrap{position:absolute;inset:0;z-index:40;display:none;place-items:center;
  background:rgba(0,0,0,.35);backdrop-filter:blur(3px)}
.dlgwrap.on{display:grid}
.dlg{width:min(460px,86%);background:var(--core-2);border:1px solid var(--hair);
  border-radius:14px;padding:18px 20px}
.dlg .dt{font-size:13px;font-weight:500;letter-spacing:-.01em;margin-bottom:2px}
.dlg .ds{font-family:"Geist Mono",monospace;font-size:10px;color:var(--faint);margin-bottom:12px}
.dlg .dh{font-family:"Geist Mono",monospace;font-size:9.5px;color:var(--faint);margin:10px 0 7px}
.dlg .dm{font-family:"Geist Mono",monospace;font-size:10.5px;line-height:1.7;color:var(--txt);
  background:var(--shell);border:1px solid var(--hair);border-radius:9px;
  padding:10px 12px;margin-bottom:8px;word-break:break-word}
.dlg .dm.sub{background:var(--shell);border-color:var(--hair)}
.dlg .dm.sub.run{border-color:var(--live-dim)}
.dlg .dx{margin-top:8px;float:right;font-family:inherit;font-size:11px;color:var(--txt);
  background:var(--hair);border:1px solid var(--edge-past);border-radius:8px;
  padding:7px 16px;cursor:pointer;transition:transform .4s var(--ease)}
.dlg .dx:active{transform:scale(.96)}
/* portas de conexão nas bordas do card */
.p-in,.p-out{position:absolute;top:50%;width:8px;height:8px;border-radius:50%;
  transform:translateY(-50%);z-index:2;background:var(--core-2);
  border:1.5px solid var(--edge-past);transition:border-color .6s var(--ease)}
.p-in{left:-4px}.p-out{right:-4px}
.node.active .p-in{border-color:var(--live)}
.node.done .p-in,.node.done .p-out{border-color:var(--txt)}
.node.humc .p-in,.node.humc .p-out{border-color:var(--hold-dim)}
.node.humc.done .p-in,.node.humc.done .p-out{border-color:var(--txt)}
.node.humc .n-core{border-style:dashed;border-color:var(--hold-dim)}
/* passo removido na escalação */
.node.skipped{opacity:.4}
.node.skipped .n-core{border-style:dashed}
/* passo extra (subfluxo criado em runtime por correções) */
.node.dync .n-core{border-style:dashed}
.edges path.dyn{stroke-dasharray:5 6}
.node.humc .n-lay{color:var(--hold)}
.node.humc.active .n-core{border-style:solid;border-color:var(--hold)}
.node.humc.active .n-t{color:var(--txt)}""")

# personagens: badge verde some (o rail já diz "vivo"); pulso e glow saem
rep(".tok.busy .badge{opacity:1;color:var(--live)}", ".tok.busy .badge{opacity:1;color:var(--dim)}")
rep_between(".tvscr{animation:tvf", ".pulse.h{border-color:var(--hold)}", "")

# roster: verde só no papel ativo (já era); painel do leader sem moldura dupla
rep(""".lead{margin:0 12px 10px;flex:0 0 auto;background:var(--shell);border:1px solid var(--hair-soft);
  border-radius:17px;padding:5px}
.lead-c{background:var(--core-2);border-radius:12px;padding:11px 12px;position:relative;overflow:hidden}""",
""".lead{margin:0 12px 10px;flex:0 0 auto}
.lead-c{background:var(--core-2);border:1px solid var(--hair);border-radius:10px;padding:11px 12px;position:relative;overflow:hidden}""")

# zoom: botão "on" em tinta, não verde
rep(".zoom button.on{background:var(--live-soft);border-color:var(--live-dim);color:var(--live)}",
    ".zoom button.on{background:var(--hair);border-color:var(--edge-past);color:var(--txt)}")

# ---------------------------------------------------------------- CSS: stream agrupado
rep_between(".stream{padding:0 13px 13px", ".ev.note .what{color:var(--txt)}",
""".stream{padding:0 13px 13px;overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:1px}
/* cabeçalho de grupo: um por passo (id · título · camada · N ações) */
.evh{display:flex;align-items:baseline;gap:7px;padding:9px 9px 4px;margin-top:6px;
  font-family:"Geist Mono",monospace;font-size:10px;line-height:1.4;color:var(--dim);
  border-top:1px solid var(--hair-soft)}
.evh:first-child{border-top:0;margin-top:0}
.evh .hid{font-weight:500;color:var(--txt);flex:0 0 auto}
.evh .ht{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--txt)}
.evh .hm{flex:0 0 auto;color:var(--faint);white-space:nowrap}
.evh.run .hid,.evh.run .hm{color:var(--live)}
.evh.hum .hid{color:var(--hold)}
/* linhas: tool calls indentadas sob o cabeçalho, papel em mono cinza */
.ev{display:flex;gap:8px;padding:3px 9px;border-radius:7px;
  font-family:"Geist Mono",monospace;font-size:10px;line-height:1.5;opacity:0}
.ev.sub{padding-left:22px}
.ev .who{color:var(--faint);flex:0 0 auto;min-width:0;max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ev.sys .who{color:var(--faint)}
.ev.hum .who{color:var(--hold)}
.ev .what{color:var(--dim);word-break:break-word;min-width:0;flex:1}
.ev.rep{background:var(--shell)}
.ev.rep .what{color:var(--txt)}
.ev.hum{background:var(--hold-soft)}
.ev.hum .what{color:var(--txt)}
/* veredito do leader: callout em tinta, com a barra lateral */
.ev.note{background:var(--shell);border-left:2px solid var(--txt);border-radius:0 7px 7px 0;padding:6px 9px;margin:4px 0}
.ev.note .who{color:var(--txt)}
.ev.note .what{color:var(--txt)}""")

# runs: pílula "ao vivo" e diff em tinta/verde de diff apenas
rep(""".runrow .rr-live{font-family:"Geist Mono",monospace;font-size:8px;color:var(--live);
  border:1px solid var(--live-dim);border-radius:999px;padding:2px 8px}""",
""".runrow .rr-live{font-family:"Geist Mono",monospace;font-size:8.5px;color:var(--live);display:flex;align-items:center;gap:5px}
.runrow .rr-live::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--live)}""")

# ---------------------------------------------------------------- CSS: gantt em rails
rep_between(".gantt{position:absolute;inset:0", ".g-axis{display:flex;justify-content:space-between;margin:4px 0 14px 120px;\n  font-family:\"Geist Mono\",monospace;font-size:8.5px;color:var(--faint)}",
""".gantt{position:absolute;inset:0;z-index:15;display:none;overflow:auto;
  background:var(--core);padding:22px 28px 60px}
.gantt.on{display:block}
.g-row{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.g-name{width:96px;flex:0 0 96px;font-family:"Geist Mono",monospace;font-size:10px;
  color:var(--dim);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g-lane{flex:1;position:relative;height:26px;border-bottom:1px solid var(--hair-soft)}
/* a barra do Gantt é o RAIL do card, deitado na linha do tempo */
.g-bar{position:absolute;top:6px;height:14px;font-family:"Geist Mono",monospace;font-size:9.5px;
  color:var(--txt);display:flex;align-items:center;padding:0 5px;overflow:hidden;white-space:nowrap;
  cursor:default;min-width:3px;border-radius:2px;background:var(--shell)}
.g-bar::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--txt)}
.g-bar.run::after{background:repeating-linear-gradient(90deg,var(--live) 0 8px,transparent 8px 14px);animation:railrun 1s linear infinite}
.g-bar.run{color:var(--live)}
.g-bar.hum{color:var(--hold)}
.g-bar.hum::after{background:repeating-linear-gradient(90deg,var(--hold) 0 5px,transparent 5px 9px)}
.g-in{margin-left:6px;color:var(--faint);font-size:9px}
.g-bar.run .g-in{color:var(--live)}
.g-dur{position:absolute;top:8px;margin-left:6px;font-family:"Geist Mono",monospace;font-size:9px;color:var(--faint);white-space:nowrap}
.g-axis{display:flex;justify-content:space-between;margin:4px 0 14px 108px;
  font-family:"Geist Mono",monospace;font-size:9px;color:var(--faint)}""")

# ---------------------------------------------------------------- HTML
rep("""<div class="mesh"><div class="orb a"></div><div class="orb b"></div></div>
<div class="grain"></div>
""", "")

rep("""    <div class="strip">
      <div class="chip btn ok" id="c-panl" title="mostrar/ocultar coluna do time (ctrl+B)">&#9703;</div>
      <div class="chip" id="c-session"><span class="d"></span>sessão <b>—</b></div>
      <div class="chip" id="c-tok" style="display:none">&Sigma; <b>0</b> tok</div>
      <span class="grow"></span>
      <div class="chip btn" id="c-gantt">gantt</div>
      <div class="chip btn" id="c-runs">runs</div>
      <div class="chip btn ok" id="c-snd">som <b>on</b></div>
      <div class="chip btn" id="c-theme">tema <b>dark</b></div>
      <div class="chip btn" id="c-lang">PT-BR</div>
      <div class="chip btn ok" id="c-panr" title="mostrar/ocultar coluna de atividade (ctrl+L)">&#9707;</div>
    </div>""",
"""    <div class="strip">
      <div class="chip btn icon ok" id="c-panl" title="mostrar/ocultar coluna do time (ctrl+B)">&#9703;</div>
      <div class="chip" id="c-session"><span class="d"></span>sessão <b>—</b></div>
      <div class="chip" id="c-tok" style="display:none">&Sigma; <b>0</b> tok</div>
      <span class="grow"></span>
      <div class="seg">
        <div class="chip btn ok" id="c-flow">fluxo</div>
        <div class="chip btn" id="c-gantt">gantt</div>
        <div class="chip btn" id="c-runs">runs</div>
      </div>
      <div class="chip btn icon" id="c-more" title="som, tema, idioma">&#8943;</div>
      <div class="menu" id="menu">
        <div class="chip btn ok" id="c-snd">som <b>on</b></div>
        <div class="chip btn" id="c-theme">tema <b>dark</b></div>
        <div class="chip btn" id="c-lang">PT-BR</div>
      </div>
      <div class="chip btn icon ok" id="c-panr" title="mostrar/ocultar coluna de atividade (ctrl+L)">&#9707;</div>
    </div>""")

# ---------------------------------------------------------------- JS: constantes / geometria
rep("const CARD_W=176,COLW=240,X0=620,MIDY=340,ROWGAP=270; /* X0 abre espaco pra lounge a esquerda */",
    "const CARD_W=192,COLW=236,X0=600,MIDY=340,ROWGAP=236; /* X0 abre espaco pras baias a esquerda; ROWGAP = card + estacao + folga */")
rep("const x1=P.x+93,x2=Q.x-93,y1=P.y,y2=Q.y;", "const x1=P.x+CARD_W/2+4,x2=Q.x-CARD_W/2-4,y1=P.y,y2=Q.y;")
rep("const x1=parent.x+93,x2=s.x-93,y1=parent.y,y2=s.y;", "const x1=parent.x+CARD_W/2+4,x2=s.x-CARD_W/2-4,y1=parent.y,y2=s.y;")
rep("{x:-88,y:-CARD_H/2,opacity:0,scale:.86,filter:\"blur(8px)\"});});", "{x:-CARD_W/2,y:-CARD_H/2,opacity:0,scale:.86,filter:\"blur(8px)\"});});")
rep("gsap.set(n,{x:-88,y:-CARD_H/2,opacity:1});", "gsap.set(n,{x:-CARD_W/2,y:-CARD_H/2,opacity:1});")

# ---------------------------------------------------------------- JS: markup do card (uma função, dois usos)
rep("""function buildGraph(){
  computeLayout(plan);""",
"""/* markup do card v2 — id · camada · estado / título / rail / métricas · quem.
   Tamanho: largura fixa (CARD_W) e altura UNIFORME por run = a do card que mais
   precisa (medida após render, em buildGraph). O título nunca corta. */
const whoOf=s=>{if(s.human)return LANG==="pt"?"você":"you";const w=String(s.owner||"").replace("-intern","");
  return String(s.layer||"").toLowerCase().includes(w)?"":w;}; /* "frontend · frontend" não diz nada */
function cardHTML(s){
  return `<div class="n-shell"><div class="n-core">
      <div class="n-h"><span class="n-id">${esc(s.id)}</span><span class="n-lay">${esc(s.layer||"")}</span><span class="n-subs"></span><span class="n-dot"></span></div>
      <div class="n-t" title="${esc(s.title)}">${esc(s.title)}</div>
      <div class="n-rail"><i></i></div>
      <div class="n-f"><span class="n-tm">—</span><span class="n-who">${esc(whoOf(s))}</span></div>
      <div class="n-check">&#10003;</div></div></div>`;
}
function buildGraph(){
  computeLayout(plan);""")

rep("""    n.innerHTML=`<div class="n-shell"><div class="n-core">
      <div class="n-lay">${esc(s.layer||"")} <span class="n-subs"></span></div><div class="n-t" title="${esc(s.title)}">${esc(s.title)}</div>
      <div class="n-f"><span class="n-tm">0s</span></div>
      <div class="n-check">&#10003;</div></div></div>
      ${hasIn?'<span class="p-in"></span>':''}${hasOut?'<span class="p-out"></span>':''}`;""",
"""    n.innerHTML=cardHTML(s)+`${hasIn?'<span class="p-in"></span>':''}${hasOut?'<span class="p-out"></span>':''}`;""")

rep("""  n.innerHTML=`<div class="n-shell"><div class="n-core">
    <div class="n-lay">${esc(s.layer||"")} <span class="n-subs"></span></div>
    <div class="n-t" title="${esc(s.title)}">${esc(s.title)}</div>
    <div class="n-f"><span class="n-tm">0s</span></div>
    <div class="n-check">&#10003;</div></div></div>
    <span class="p-in"></span>`;""",
"""  n.innerHTML=cardHTML(s)+`<span class="p-in"></span>`;""")

# altura uniforme: mede o .n-core com height:auto (já era assim); min-height menor no card v2
rep("  let core=100;\n  steps.forEach(s=>{const n=nodeEl[s.id];if(!n)return;const c=n.querySelector(\".n-core\");",
    "  let core=78;\n  steps.forEach(s=>{const n=nodeEl[s.id];if(!n)return;const c=n.querySelector(\".n-core\");")
rep("    let c2=100;\n    list.forEach(n=>{const c=n.querySelector(\".n-core\");if(!c)return;",
    "    let c2=78;\n    list.forEach(n=>{const c=n.querySelector(\".n-core\");if(!c)return;")

# badge de correção: "+N" âmbar, em vez de "1/1 extra"
rep("""  el.textContent=done+"/"+subs.length+" extra"+(subs.length>1?"s":"");
  el.title=subs.map(q=>(q.status==="done"?"✓ ":"● ")+q.title).join("\\n");""",
"""  el.textContent="+"+subs.length;
  el.title=(LANG==="pt"?"correções: ":"fixes: ")+done+"/"+subs.length+"\\n"+subs.map(q=>(q.status==="done"?"✓ ":"● ")+q.title).join("\\n");""")

# ---------------------------------------------------------------- JS: pulso na cadeira sai (o rail já diz "vivo")
rep("""        if(liveMode&&s.status==="running"&&!s._pr){
          const pr=document.createElement("div");pr.className="pulse";
          pr.style.left=(SEAT(s).x-10)+"px";pr.style.top=(SEAT(s).y-8)+"px";stage.appendChild(pr);
          gsap.fromTo(pr,{opacity:.65,scale:1},{opacity:0,scale:2.1,duration:1.6,ease:"power2.out",repeat:-1});
          s._pr=pr;}
""", "")

# ---------------------------------------------------------------- JS: prefers-reduced-motion
rep("const sleep=ms=>new Promise(r=>setTimeout(r,ms));",
    """const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* movimento reduzido: o personagem aparece na mesa em vez de caminhar; sem bob */
const RM=matchMedia("(prefers-reduced-motion: reduce)");""")
rep("  if(!liveMode||document.hidden){stopMove(t);gsap.set(el,{left:x,top:y,y:0});return;}",
    "  if(!liveMode||document.hidden||RM.matches){stopMove(t);gsap.set(el,{left:x,top:y,y:0});return;}")
rep("const bob=t=>{if(liveMode)gsap.to(t.el,", "const bob=t=>{if(liveMode&&!RM.matches)gsap.to(t.el,")

# ---------------------------------------------------------------- JS: stream agrupado por passo
rep("""function log(who,what,cls){
  $("#empty")?.remove();
  const e=document.createElement("div");
  e.className="ev"+(cls?" "+cls:"")+(who==="leader"?" sys":"");""",
"""/* grupo por passo: um cabeçalho (id · título · N ações) e as tool calls indentadas
   abaixo. Interleaving de papéis abre um cabeçalho novo — a leitura é cronológica. */
let lastGroup=null;const headEl={};
function logHead(s){
  $("#empty")?.remove();
  const h=document.createElement("div");
  h.className="evh"+(s.status==="running"||s.status==="waiting"?" run":"")+(s.human?" hum":"");
  h.dataset.step=s.id;
  h.innerHTML=`<span class="hid">${esc(s.id)}</span><span class="ht" title="${esc(s.title)}">${esc(s.title)}</span><span class="hm"></span>`;
  stream.appendChild(h);headEl[s.id]=h;lastGroup=s.id;headMeta(s);
  if(liveMode)gsap.fromTo(h,{opacity:0},{opacity:1,duration:.4});
  stream.scrollTop=stream.scrollHeight;
}
function headMeta(s){
  const h=headEl[s.id];if(!h||!h.isConnected)return;
  const run=s.status==="running"||s.status==="waiting";
  h.classList.toggle("run",run);
  const m=h.querySelector(".hm");
  if(m)m.textContent=s.human?"":((s._tools||0)+" "+t("actions")+(run?"":" · "+gateTxt(s)));
}
function log(who,what,cls,step){
  $("#empty")?.remove();
  if(step){ if(lastGroup!==step.id||!headEl[step.id]||!headEl[step.id].isConnected)logHead(step); headMeta(step); }
  else lastGroup=null;
  const e=document.createElement("div");
  e.className="ev"+(cls?" "+cls:"")+(who==="leader"?" sys":"")+(step?" sub":"");""")

# o "iniciou" vira o cabeçalho do grupo; tool calls e "encerrou" ficam sob ele
rep("""    log(role.replace("-intern",""),t("started")(s.id,s.title));
    focus(s.x,s.y+40,stepZoom());""",
"""    logHead(s);
    focus(s.x,s.y+40,stepZoom());""")
rep("""    const line=(e.tool||"")+" "+shortPath(e.info);
    log(who,line);
    think(role,line);
    { const tk=toks[role]; if(tk) tk._read=/^(Read|Grep|Glob|LS|WebFetch|WebSearch|NotebookRead)$/.test(e.tool||""); }
    const st=aidStep[e.aid];if(st){st._tools=(st._tools||0)+1;st._lastEv=e.t||Date.now();}
    return;}""",
"""    const line=(e.tool||"")+" "+shortPath(e.info);
    const st=aidStep[e.aid];if(st){st._tools=(st._tools||0)+1;st._lastEv=e.t||Date.now();}
    log(who,line,"",st);
    think(role,line);
    { const tk=toks[role]; if(tk) tk._read=/^(Read|Grep|Glob|LS|WebFetch|WebSearch|NotebookRead)$/.test(e.tool||""); }
    return;}""")
# "encerrou": sob o grupo do passo, e o cabeçalho perde o verde
rep("""      updCnt();
      log(role.replace("-intern",""),t("finished")(s.id),"rep");
      chain(role,async()=>{const tk=toks[role];if(tk)tk.el.classList.remove("busy");});
      return;}""",
"""      updCnt();
      log(role.replace("-intern",""),t("finished")(s.id),"rep",s);
      chain(role,async()=>{const tk=toks[role];if(tk)tk.el.classList.remove("busy");});
      return;}""")
rep("""    updCnt();
    lastDone=s;
    log(role.replace("-intern",""),t("finished")(s.id),"rep");""",
"""    updCnt();
    lastDone=s;
    log(role.replace("-intern",""),t("finished")(s.id),"rep",s);""")
# reset do stream limpa os grupos
rep("""  stream.innerHTML="";
  edgesSvg.innerHTML="";
  if(ganttOn)renderGantt();""",
"""  stream.innerHTML="";lastGroup=null;for(const k in headEl)delete headEl[k];
  edgesSvg.innerHTML="";
  if(ganttOn)renderGantt();""")

# ---------------------------------------------------------------- JS: cabeçalho — segmentado + menu
rep("""$("#c-gantt").onclick=()=>{
  ganttOn=!ganttOn;
  $("#gantt").classList.toggle("on",ganttOn);
  $("#c-gantt").classList.toggle("ok",ganttOn);""",
"""function setGantt(on){
  ganttOn=on;
  $("#gantt").classList.toggle("on",ganttOn);
  $("#c-gantt").classList.toggle("ok",ganttOn);
  $("#c-flow").classList.toggle("ok",!ganttOn);
  if(ganttOn){renderGantt();ganttIv=setInterval(renderGantt,1000);}
  else if(ganttIv){clearInterval(ganttIv);ganttIv=null;}
}
$("#c-flow").onclick=()=>setGantt(false);
/* menu ⋯ (som, tema, idioma): fecha ao clicar fora */
$("#c-more").onclick=e=>{e.stopPropagation();$("#menu").classList.toggle("on");};
addEventListener("click",e=>{if(!e.target.closest("#menu"))$("#menu").classList.remove("on");});
$("#c-gantt").onclick=()=>{
  ganttOn=!ganttOn;
  $("#gantt").classList.toggle("on",ganttOn);
  $("#c-gantt").classList.toggle("ok",ganttOn);
  $("#c-flow").classList.toggle("ok",!ganttOn);""")

# ---------------------------------------------------------------- JS: gantt em rails
rep("""      bars+=`<div class="g-bar${cls}" style="left:${a}%;width:${Math.max(.4,b-a)}%" title="${tip.replace(/"/g,"&quot;")}">${s.id}</div>`;""",
"""      const w=Math.max(.4,b-a);
      bars+=`<div class="g-bar${cls}" style="left:${a}%;width:${w}%" title="${tip.replace(/"/g,"&quot;")}">${esc(s.id)}</div>`
        +`<span class="g-dur" style="left:${a+w}%">${fmt((s._end||nowT())-s._start)}</span>`;""")

# ponto de veredito: no NODE (o .n-core corta pelo overflow), meio fora do canto
rep('          n.querySelector(".n-core").appendChild(b);', '          n.appendChild(b);')

# gantt: duração dentro da barra quando cabe; fora, só quando a barra é estreita
rep("""      bars+=`<div class="g-bar${cls}" style="left:${a}%;width:${w}%" title="${tip.replace(/"/g,"&quot;")}">${esc(s.id)}</div>`
        +`<span class="g-dur" style="left:${a+w}%">${fmt((s._end||nowT())-s._start)}</span>`;""",
"""      const du=fmt((s._end||nowT())-s._start);
      bars+=`<div class="g-bar${cls}" style="left:${a}%;width:${w}%" title="${tip.replace(/"/g,"&quot;")}">${esc(s.id)}${w>9?`<span class="g-in">${du}</span>`:""}</div>`
        +(w>9?"":`<span class="g-dur" style="left:${a+w}%">${du}</span>`);""")

# etiqueta do personagem: abaixo dos pés, nunca sob o sprite
rep(""".tok .badge{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:-6px;""",
    """.tok .badge{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:1px;z-index:1;""")

# depuracao/screenshots: expoe focus() no window.tv (read-only, sem efeito em producao)
rep("  get evlog(){return EV_LOG},", "  get evlog(){return EV_LOG},focus,")

open(dst, "w", encoding="utf-8").write(html)
print("ok:", dst, len(html), "bytes")
