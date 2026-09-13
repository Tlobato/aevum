#!/usr/bin/env node
// Utilitário CLI para executar consultas e inspeções no banco Neon do Aevum
// Uso: node infra/neon-cli.mjs "SELECT count(*) FROM capsules;"

import os from "os";
import path from "path";

// Tenta carregar das variáveis globais seguras fora do repositório
try { process.loadEnvFile(path.resolve(os.homedir(), ".gemini/config/.aevum.env")); } catch (_) {}

const connectionUri = process.env.AEVUM_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!connectionUri) {
  console.error("Erro: AEVUM_NEON_DATABASE_URL não configurada no ambiente do usuário ou em ~/.gemini/config/.aevum.env");
  process.exit(1);
}

const query = process.argv[2] || "SELECT table_name FROM information_schema.tables WHERE table_schema='public';";

async function main() {
  try {
    const url = new URL(connectionUri);
    const host = url.host;

    const res = await fetch(`https://${host}/sql`, {
      method: 'POST',
      headers: {
        'Neon-Connection-String': connectionUri,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    if (data.message) {
      console.error("Erro Neon SQL:", data.message);
      process.exit(1);
    }

    console.log(JSON.stringify(data.rows, null, 2));
  } catch (err) {
    console.error("Falha ao consultar Neon:", err);
    process.exit(1);
  }
}

main();
