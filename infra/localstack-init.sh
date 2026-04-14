#!/bin/bash
# Script executado automaticamente pelo LocalStack ao iniciar.
# Cria o bucket de armazenamento e configura o CORS para o frontend.

echo "--- [Aevum] Inicializando recursos AWS locais... ---"

# Cria o bucket principal
awslocal s3api create-bucket \
  --bucket aevum-storage-bucket \
  --region us-east-1

echo "--- [Aevum] Bucket 'aevum-storage-bucket' criado. ---"

# Configura CORS para permitir PUT direto do navegador
awslocal s3api put-bucket-cors \
  --bucket aevum-storage-bucket \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "GET", "HEAD"],
        "AllowedOrigins": ["http://localhost:3000"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'

echo "--- [Aevum] CORS configurado no bucket. Ambiente pronto! ---"
