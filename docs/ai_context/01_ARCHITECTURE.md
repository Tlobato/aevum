# Aevum - MVP Architecture & Implementation Plan

Bem-vindo ao início do Aevum! Como seu CTO e Arquiteto, fico feliz com a escolha da **Rota 2 (Spring Boot Native + GraalVM)**. É uma excelente decisão estratégica para aproveitar seu background sólido em Java e, ao mesmo tempo, obter as vantagens do mundo Serverless (baixo custo e escalabilidade rápida).

Aqui está o planejamento detalhado para o nosso MVP, abordando as preocupações de viabilidade de longo prazo (décadas) e a rica experiência de usuário (tátil e emocional).

## 1. Stack Tecnológica (O "Porquê")

### Backend: Spring Boot 3 + GraalVM Native Image
*   **Por que:** Combina o ecossistema robusto e fortemente tipado do Java (ótimo para nós dois - e perfeito para a IA entender e gerar) com tempos de inicialização sub-segundo e uso mínimo de memória.
*   **Custo:** Permite hospedar a API em serviços serverless como **AWS Lambda** ou **Google Cloud Run**. Você só paga quando a cápsula está sendo acessada ou criada. Se ninguém acessa, o custo computacional é praticamente zero. Nosso objetivo de viabilidade para décadas está garantido.

### Frontend: Next.js (React) + Framer Motion (ou GSAP) + Tailwind CSS
*   **Por que:** Next.js é o padrão da indústria para aplicações web modernas (SSR e SSG). Para a exigência de ser "tátil e satisfatório (estilo Royal Match)", bibliotecas de animação como Framer Motion ou GSAP são essenciais.
*   **Custo:** Pode ser hospedado na Vercel (free tier excelente para start) ou exportado estaticamente para um S3 + CloudFront (custo ínfimo).

### Armazenamento de Dados e Arquivos
*   **Banco de Dados (Metadados da Cápsula):** **PostgreSQL** Serverless (ex: Supabase ou AWS Aurora Serverless v2/Neon DB). O dado relacional dura muito bem no tempo e o custo em escala zero é mínimo.
*   **Arquivos (Fotos/Vídeos):** **AWS S3 com transição para S3 Glacier**.
    *   *O pulo do gato para 20-50 anos:* Quando um usuário faz upload, ele vai pro S3 Standard. Após o processamento/selo da cápsula, movemos automaticamente para o Glacier Deep Archive (custo de frações de centavos por GB/mês). Fica "congelado" até o dia da abertura.

---

## 2. Estratégia de Identidade e Acesso para Décadas

Como garantir que o usuário abra a cápsula daqui a 50 anos, mesmo se emails deixarem de existir ou provedores mudarem?

1.  **Chave de Recuperação Mestra (A Abordagem "Cold Wallet"):**
    *   No momento em que a cápsula é selada, geramos uma frase de 12 a 24 palavras (bip39) ou um QR Code impresso e auto-explicativo.
    *   Instruímos o usuário a guardá-la junto com seus documentos físicos ou num cofre familiar. Essa chave é gerada offline pelo client e a hash é guardada no backend.
2.  **Guardiões da Memória (Delegates):**
    *   O usuário cadastra 2 "guardiões" (ex: filhos, irmãos).
    *   Se, chegando no ano combinado, o usuário original não puder ser contatado, o sistema enviará links de autorização parcial para os guardiões. Se M dos N guardiões aprovarem, a cápsula é aberta para eles.
3.  **Pulse Check Anual (O "Heartbeat"):**
    *   Enviamos um email/SMS anualmente apenas dizendo: *"Sua cápsula Aevum continua segura. Seu e-mail ou telefone mudou? Atualize aqui"*. Isso mantém o cordão umbilical ativo.
4.  **Autenticação Padrão Hoje:**
    *   Passkeys e Login Social (Google/Apple) usando um serviço como Clerk ou Supabase Auth, minimizando nossa responsabilidade sobre senhas.

---

## 3. Estrutura do Monorepo

Como teremos um backend em Java e frontend em Node.js/JS, não usaremos o Lerna. O ideal é estruturar a pasta raiz simplesmente, utilizando Gradle para o backend e NPM/Yarn/PNPM workspaces ou Turborepo para ferramentas de gestão do repositório JS, mas os ciclos de build serão isolados.

```text
aevum/
├── .github/                  # CI/CD (Actions para build GraalVM e Next.js)
├── frontend/                 # Aplicação Next.js (App tátil)
│   ├── package.json
│   ├── src/
│   │   ├── app/              # Rotas e páginas
│   │   ├── components/       # Componentes visuais/animações tateis
│   │   └── lib/              # Integrações (S3, API)
├── backend/                  # API Spring Boot
│   ├── build.gradle
│   ├── src/
│   │   └── main/java/com/aevum/
│   │       ├── api/          # Endpoints REST
│   │       ├── domain/       # Regras de negócio, Cápsulas
│   │       └── infra/        # Adaptação S3, BD, Auth
├── infra/                    # IaC (Terraform ou Pulumi para AWS/GCP)
├── docs/                     # Documentação de Arquitetura, ADRs
└── README.md
```
