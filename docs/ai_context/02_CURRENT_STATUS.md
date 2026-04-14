# Status Atual do Projeto (Overview)

## Resumo Executivo
O projeto Aevum está com sua **pilha completa integrada e rodando localmente**: Frontend Next.js, Backend Spring Boot, banco PostgreSQL e agora o **LocalStack simulando S3 da AWS sem custo de nuvem**. A experiência de criação e gestão de relíquias é real e multi-cápsula, com cada usuário podendo gerenciar uma coleção de legados independentes.

---

## 1. O que está concluído e Estabilizado

### Frontend (Next.js)
- **Portal de Acesso (`/`):** Tela de login minimalista Aevum — usuário entra com e-mail, recebe UUID e sessão salva via `AuthContext` + `localStorage`.
- **Dashboard (`/dashboard`):** Galeria de cards de todas as cápsulas do usuário com barra de quota individual, data de despertar, badge de status e botão de entrada. Botão "Forjar Nova Relíquia" abre form inline com estimativa dinâmica de preço.
- **Vault (`/vault/[id]`):** Baú Cinemático conectado à API — carrega dados reais da cápsula pelo ID da URL. Upload de memórias usa Optimistic UI (animação instantânea + upload S3 em background com rollback em caso de erro).

### Backend (Spring Boot)
- **Autenticação Provisória:** `POST /api/v1/auth/login` — findOrCreate por e-mail. CORS global liberando `localhost:3000`.
- **Motor de Precificação:** `PricingService` com matriz Espaço x Tempo. Endpoint `POST /estimate` para orçamento sem cápsula salva.
- **Cápsulas Multi-usuário:** `CapsuleController` usa `@RequestHeader("X-User-Id")` em todos os endpoints. Usuário tem `@OneToMany` cápsulas via FK real no banco.
- **Storage:** `StorageService` com Presigned URLs (PUT direto do browser para o S3), freeze para Glacier no Seal, e Job de Restore Preemptivo (T-48h).
- **CORS:** `WebMvcConfigurer` global configurado em `CorsConfig.java`.

### Infra Local (Docker)
- **PostgreSQL 16:** Volume persistente, healthcheck configurado.
- **LocalStack v3 (community):** Simula S3 AWS na porta `4566`. Script `infra/localstack-init.sh` cria o bucket `aevum-storage-bucket` e configura CORS automaticamente no boot.
- **AwsConfig.java:** Bean central de `S3Client`/`S3Presigner` com `endpointOverride` para LocalStack e `pathStyleAccessEnabled(true)`.

---

## 2. O que falta (Próximos Passos)
- **Upload Flow Completo:** Testar Presigned URL ponta a ponta contra o LocalStack real (frontend → S3 local → confirmação no banco).
- **Autenticação Real:** Substituir `X-User-Id` header por JWT validado (Clerk ou Spring Security).
- **Tela de Checkout/Pagamento:** Fluxo de pagamento simulado antes do Seal definitivo.
- **Testes:** Testes de integração para os endpoints principais.
