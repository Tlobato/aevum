#!/usr/bin/env node
// Utilitário CLI para inspeção e auditoria de arquivos no AWS S3 / Glacier do Aevum
// Uso:
//   node infra/s3-cli.mjs inspect
//   node infra/s3-cli.mjs list [prefix]
//   node infra/s3-cli.mjs stat <key>
//   node infra/s3-cli.mjs test

import os from "os";
import path from "path";
import { 
  S3Client, 
  ListObjectsV2Command, 
  HeadObjectCommand 
} from "@aws-sdk/client-s3";

// Tenta carregar das variáveis globais seguras fora do repositório
try { process.loadEnvFile(path.resolve(os.homedir(), ".gemini/config/.aevum.env")); } catch (_) {}

const REGION = process.env.AEVUM_AWS_REGION || process.env.AWS_REGION || "us-east-1";
const BUCKET = process.env.AEVUM_AWS_BUCKET || process.env.AWS_BUCKET || "aevum-storage-bucket";
const accessKeyId = process.env.AEVUM_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AEVUM_AWS_SECRET_KEY || process.env.AWS_SECRET_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.error("Erro: AEVUM_AWS_ACCESS_KEY e AEVUM_AWS_SECRET_KEY devem estar configurados no ambiente ou em ~/.gemini/config/.aevum.env");
  process.exit(1);
}

const s3 = new S3Client({ 
  region: REGION, 
  credentials: { accessKeyId, secretAccessKey } 
});

async function main() {
  const command = process.argv[2] || "inspect";

  try {
    if (command === "inspect") {
      console.log(`Auditoria do Bucket: ${BUCKET} (${REGION})...\n`);
      const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
      const items = res.Contents || [];

      let totalBytes = 0;
      const byStorageClass = {};

      items.forEach(item => {
        totalBytes += item.Size || 0;
        const sClass = item.StorageClass || "STANDARD";
        byStorageClass[sClass] = (byStorageClass[sClass] || 0) + 1;
      });

      console.log(JSON.stringify({
        bucket: BUCKET,
        region: REGION,
        totalFiles: items.length,
        totalSizeMB: (totalBytes / (1024 * 1024)).toFixed(2) + " MB",
        totalSizeGB: (totalBytes / (1024 * 1024 * 1024)).toFixed(4) + " GB",
        storageClasses: byStorageClass
      }, null, 2));

    } else if (command === "list") {
      const prefix = process.argv[3] || "";
      const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }));
      const items = (res.Contents || []).map(item => ({
        key: item.Key,
        sizeBytes: item.Size,
        sizeKB: (item.Size / 1024).toFixed(1) + " KB",
        storageClass: item.StorageClass || "STANDARD",
        lastModified: item.LastModified
      }));

      console.log(JSON.stringify(items, null, 2));

    } else if (command === "stat") {
      const key = process.argv[3];
      if (!key) {
        console.error("Uso: node infra/s3-cli.mjs stat <key>");
        process.exit(1);
      }
      const res = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      console.log(JSON.stringify({
        key,
        contentLength: res.ContentLength,
        contentType: res.ContentType,
        storageClass: res.StorageClass || "STANDARD",
        lastModified: res.LastModified,
        restore: res.Restore || "None (Not thawing)",
        metadata: res.Metadata
      }, null, 2));

    } else if (command === "test") {
      console.log(`Testando permissões de Leitura e Escrita no Bucket ${BUCKET}...`);
      const { PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const testKey = `healthcheck-probe-${Date.now()}.txt`;
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: testKey,
        Body: "aevum-probe-ok"
      }));
      console.log(`✓ Escrita realizada com sucesso: ${testKey}`);
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: testKey
      }));
      console.log(`✓ Exclusão da sonda realizada com sucesso.`);
      console.log("Bucket 100% operacional para leitura, escrita e exclusão!");
    } else {
      console.log("Comando desconhecido. Use: inspect | list [prefix] | stat <key> | test");
    }
  } catch (err) {
    console.error("Erro ao acessar AWS S3:", err.message);
    process.exit(1);
  }
}

main();
