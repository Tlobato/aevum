#!/usr/bin/env node
// Utilitário CLI para monitoramento e gestão do backend Aevum no Render
// Uso: 
//   node infra/render-cli.mjs status
//   node infra/render-cli.mjs deploys
//   node infra/render-cli.mjs events
//   node infra/render-cli.mjs restart
//   node infra/render-cli.mjs deploy

import os from "os";
import path from "path";

// Tenta carregar das variáveis globais seguras fora do repositório
try { process.loadEnvFile(path.resolve(os.homedir(), ".gemini/config/.aevum.env")); } catch (_) {}

const RENDER_API_KEY = process.env.AEVUM_RENDER_API_KEY || process.env.RENDER_API_KEY;
const SERVICE_ID = process.env.AEVUM_RENDER_SERVICE_ID || process.env.RENDER_SERVICE_ID;

if (!RENDER_API_KEY || !SERVICE_ID) {
  console.error("Erro: AEVUM_RENDER_API_KEY e AEVUM_RENDER_SERVICE_ID devem estar configurados no ambiente ou em ~/.gemini/config/.aevum.env");
  process.exit(1);
}

const headers = {
  "Authorization": `Bearer ${RENDER_API_KEY}`,
  "Accept": "application/json",
  "Content-Type": "application/json"
};

async function main() {
  const command = process.argv[2] || "status";

  try {
    if (command === "status") {
      const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}`, { headers });
      const data = await res.json();
      console.log(JSON.stringify({
        id: data.id,
        name: data.name,
        status: data.suspended,
        url: data.serviceDetails?.url,
        plan: data.serviceDetails?.plan,
        updatedAt: data.updatedAt
      }, null, 2));
    } else if (command === "deploys") {
      const limit = process.argv[3] || 5;
      const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=${limit}`, { headers });
      const data = await res.json();
      const summary = data.map(d => ({
        id: d.deploy.id,
        status: d.deploy.status,
        trigger: d.deploy.trigger,
        commit: d.deploy.commit?.message,
        startedAt: d.deploy.startedAt,
        finishedAt: d.deploy.finishedAt
      }));
      console.log(JSON.stringify(summary, null, 2));
    } else if (command === "events") {
      const limit = process.argv[3] || 5;
      const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/events?limit=${limit}`, { headers });
      const data = await res.json();
      console.log(JSON.stringify(data.map(e => ({
        id: e.event.id,
        type: e.event.type,
        timestamp: e.event.timestamp,
        details: e.event.details
      })), null, 2));
    } else if (command === "restart") {
      console.log("Solicitando reinicialização do serviço...");
      const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/restart`, {
        method: "POST",
        headers
      });
      console.log("Status:", res.status, res.statusText);
    } else if (command === "deploy") {
      console.log("Disparando novo deploy do serviço...");
      const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
        method: "POST",
        headers,
        body: JSON.stringify({ clearCache: "do_not_clear" })
      });
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log("Comando desconhecido. Use: status | deploys | events | restart | deploy");
    }
  } catch (err) {
    console.error("Erro na chamada ao Render:", err);
    process.exit(1);
  }
}

main();
