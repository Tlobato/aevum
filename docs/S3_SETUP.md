# Configuração de Infraestrutura S3 (Aevum)

Este documento contém as instruções manuais para configurar o seu Bucket na AWS de forma que o sistema de rascunhos e armazenamento de longo prazo funcione conforme o esperado.

## 1. Criação do Bucket
- **Nome:** `aevum-storage-bucket` (ou o nome definido no seu `application.yml`).
- **Região:** Recomendado `us-east-1` (Virgínia) ou `sa-east-1` (São Paulo).
- **Object Ownership:** ACLs disabled (Bucket owner enforced).
- **Public Access:** Bloqueie todo acesso público (Block all public access). O acesso será via Presigned URLs.

## 2. Configuração de Lifecycle (Regras de Ciclo de Vida)
Vá em: **Bucket > Management > Create lifecycle rule**.

### Regra: Limpeza de Rascunhos (Auto-Cleanup Drafts)
- **Rule name:** `DeleteDraftsAfter24h`
- **Prefix/Filter:** `drafts/` (Extremamente importante limitar ao prefixo drafts).
- **Lifecycle rule actions:** 
    - [x] Expire current versions of objects.
    - [x] Delete expired object delete markers or incomplete multipart uploads.
- **Expire current versions of objects:** 1 day after object creation.

> [!IMPORTANT]
> Esta regra garante que se um usuário fizer upload de 10GB de fotos e desistir de "Selar" a cápsula, você não será cobrado eternamente por esses arquivos.

## 3. Configuração de CORS (Para o Frontend)
Vá em: **Bucket > Permissions > Cross-origin resource sharing (CORS)**.

Adicione a seguinte política para permitir que o navegador envie arquivos via `PUT` direto pro S3:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "GET"],
        "AllowedOrigins": ["http://localhost:3000"],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3000
    }
]
```

## 4. Variáveis de Ambiente (Backend)
Certifique-se de que o seu servidor backend tenha as seguintes permissões (via IAM Role ou `~/.aws/credentials`):
- `s3:PutObject` (Para presigned URLs)
- `s3:CopyObject` (Para troca de Storage Class no Seal)
- `s3:RestoreObject` (Para o Job de Desgelo)
