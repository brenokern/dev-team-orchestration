#!/usr/bin/env node
"use strict";

/**
 * Instalador da skill dev-team-orchestration.
 * Uso:
 *   npx github:brenokern/dev-team-orchestration            -> instala no escopo do usuário (~/.claude/skills)
 *   npx github:brenokern/dev-team-orchestration --project  -> instala no projeto atual (./.claude/skills)
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const SKILL = "dev-team-orchestration";
const projectScope = process.argv.includes("--project");

const src = path.join(__dirname, "..", "skills", SKILL);
if (!fs.existsSync(path.join(src, "SKILL.md"))) {
  console.error(`✗ Não encontrei ${SKILL}/SKILL.md em ${src}. Rode a partir do repo da skill.`);
  process.exit(1);
}

const base = projectScope
  ? path.join(process.cwd(), ".claude", "skills")
  : path.join(os.homedir(), ".claude", "skills");
const dest = path.join(base, SKILL);

fs.mkdirSync(base, { recursive: true });
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log(`✔ ${SKILL} instalada em ${dest}`);
console.log(
  projectScope
    ? "  Escopo: projeto (compartilhada com quem clonar este repo)."
    : "  Escopo: usuário (disponível em todos os projetos). Use --project para instalar no projeto atual."
);
console.log("  Reinicie o Claude Code / a sessão para a skill aparecer.");
