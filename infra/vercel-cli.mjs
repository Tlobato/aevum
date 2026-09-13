#!/usr/bin/env node
// Utilitário CLI para monitoramento do frontend Aevum na Vercel
// Uso:
//   node infra/vercel-cli.mjs logs 10
//   node infra/vercel-cli.mjs deploys
//   node infra/vercel-cli.mjs env

import { execSync } from "child_process";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(path.resolve(os.homedir(), ".gemini/config/.aevum.env")); } catch (_) {}

const frontendDir = path.resolve(__dirname, "../frontend");
const token = process.env.VERCEL_TOKEN;

if (!token) {
  console.error("Erro: VERCEL_TOKEN não configurado no ambiente ou em ~/.gemini/config/.aevum.env");
  process.exit(1);
}

const command = process.argv[2] || "logs";

try {
  if (command === "logs") {
    const limit = process.argv[3] || 10;
    const output = execSync(`npx -y vercel logs myaevum.space --token ${token} -n ${limit}`, {
      cwd: frontendDir,
      encoding: "utf-8"
    });
    console.log(output);
  } else if (command === "deploys") {
    const output = execSync(`npx -y vercel ls aevum-app --token ${token}`, {
      cwd: frontendDir,
      encoding: "utf-8"
    });
    console.log(output);
  } else if (command === "env") {
    const output = execSync(`npx -y vercel env ls --project aevum-app --token ${token}`, {
      cwd: frontendDir,
      encoding: "utf-8"
    });
    console.log(output);
  } else {
    console.log("Comando desconhecido. Use: logs [qtd] | deploys | env");
  }
} catch (err) {
  console.error("Erro ao consultar Vercel:", err.message);
  process.exit(1);
}
