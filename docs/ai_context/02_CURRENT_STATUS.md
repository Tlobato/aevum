# Status Atual do Projeto (Overview)

## Resumo Executivo
O projeto Aevum está com sua **pilha completa integrada e rodando localmente**: Frontend Next.js, Backend Spring Boot, banco PostgreSQL e agora o **LocalStack simulando S3 da AWS sem custo de nuvem**. A experiência de criação e gestão de relíquias é real e multi-cápsula, com cada usuário podendo gerenciar uma coleção de legados independentes.

---

## 1. O que está concluído e Estabilizado

### Frontend (Next.js)
- **Portal de Acesso (`/`):** Tela de login minimalista Aevum — usuário entra com e-mail, recebe UUID e sessão salva via `AuthContext` + `localStorage`.
- **Dashboard (`/dashboard`):** Galeria de cards de todas as cápsulas do usuário com barra de quota individual, data de despertar, badge de status e botão de entrada. Botão "Forjar Nova Relíquia" abre form inline com estimativa dinâmica de preço.
- **Vault (`/vault/[id]`):** Baú Cinemático robusto.
  - **Upload via Optimistic UI:** Animação instantânea de submissão + barra de quota precisa em Bytes com *Feedback de Pulso*. Uploads pro S3 em background com fallback visual de erro.
  - **Múltiplos Formatos Ensuportados:** O *Smart Forge Modal* suporta envio de Texto, WebCam Video (nativamente processado em Blob WebM), WebCam Foto, e áudios.
  - **Cinemática de Selagem:** Ao trancar, um MP4 de fechamento renderiza e ignora Pixels Pretos via `mix-blend-screen` do CSS para uma mescla hollywoodiana sem pesar a página.
  - **Early Unlock (Taxa de Resgate):** O recibo holográfico após a selagem possui Layout Responsivo. A ação de "Resgate Imediato" engatilha um modal que simula o *Pricing Breakdown* entre Cloud Provider (Glacier Penalty) e Taxa Interna.

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
- **Upload Flow End-to-End:** Refinar o pipeline no backend para que as `Presigned URLs` apontem pro LocalStack e depois sejam registradas formalmente no banco quando a promessa HTTP fechar. Adicionar suporte robusto ao download assíncrono dessas mídias.
- **Checkout & Faturamento (Stripe):** Implementar mock ou fluxo de dev com a API da Stripe. As Actions que exigem pagamento são: A Selagem Padrão (pagamento antecipado por 5~20 anos), e o Resgate Antecipado de um baú trancado (Quebra do Paradoxo Temporal).
- **Notificação e Resgate Assíncrono:** Adicionar uma fila leve (ou Kafka / SQS local) para notificação via E-mail (`JavaMailSender` ou AWS SES mock) disparando o alerta de *Eclosão da Cápsula* na data prometida.
- **Micro-ajustes do MP4 em telas diferentes:** Conforme pedido de lembrete pelo usuário para revisar alinhamento ou opacidade no momento do Play.
