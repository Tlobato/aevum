# Histórico de Atividades (Copilot)

## 07 de Abril de 2026 - Bootstrapping / Scaffolding Base

Excelente! Demos o primeiro passo para o mundo construir a aplicação de legado de memória **Aevum**.

### O que implementamos
O repositório base agora é um *Monorepo* que possui separação total entre API e Frontend.

### Resumo das Ações
- **Backend Gerado:** Buscamos diretamente do `start.spring.io` a inicialização oficial para Spring Boot v3+ considerando `GraalVM Native Image`, `PostgreSQL`, `Data JPA` e `Web` com o Java 21, e extraímos isso para a pasta `/backend`.
- **Frontend Preparado:** Inicializado o projeto Next.js padrão + App Router + Tailwind + Framer Motion. Instalamos silenciosamente o Node.js LTS via Winget no ambiente local para concluir a operação.
- **Root Setup:** Adicionamos um `.gitignore` gigante focado em ignorar builds de `.next`, NPM e builds do `gradle` e `java`, para termos commits limpos no repositório.
- **Documentação de Iniciante:** Escrevemos o documento principal `README.md` da raiz explicando como levantar o banco, buildar e rodar o projeto do Zero.

## 09-10 de Abril de 2026 - Face Visceral do Front-end (MVP)

A experiência Visual Lúdica foi completamente fechada e alinhada às expectativas da Diretoria Executiva da Aevum. 

### O que implementamos
Refatoração absurda no UX de UI/Interatividade, aproximando um sistema "Data Entry Form" de um Game Design Tátil (referências de UX de retenção premium).

### Resumo das Ações
- **Física Framer Motion (Bocada Mágica):** Aplicou-se vetores matemáticos pesados para simular a Gravidade no DOM HTML, arremessando objetos em curva parábola na entrada do Cofre (Y Axis) enquanto rodam no próprio eixo (Rotate3D).
- **Substituição Estrita de Videos por PNG swap:** Foi implementada uma State Machine sem atraso de transição imperceptível a olho nu para trocar a imagem da "Caixa Fechada" pela da "Caixa Aberta" no exato momento da queda da relíquia, poupando absurdamente processamento do site em comparação a exportação contínua de WebM. 
- **Modal de Fornalha (UI Overlay):** O sistema agora não permite o arremesso vazio. Foi construído um modal *Glassmorphism* para input real do que passará pela balança dimensional.
- **API Real de WebCams (MediaRecorder):** Integrado a capacidade oficial do Browser de gravar Stream nativo da webcam (video/webm) perfeitamente validado na tela e empacotado como *Blob RAM file* esperando a integração oficial Java S3!

## 13-14 de Abril de 2026 - O Motor Financeiro e as Engrenagens do Tempo (Fase 5)
Foi iniciada a arquitetura que garante a sustentação técnica e econômica da cápsula do tempo para cruzar décadas ininterruptamente.

### O que implementamos
Engenharia S3 Cloud AWS v2 e Motor de Precificação no Spring Boot associados à representação mecânica no Front-end de Limite de Espaços e Efeitos Transitórios do Tempo.

### Resumo das Ações
- **Precificação por Matriz Espaço/Tempo:** Criado um Serviço Especial (`PricingService`) encarregado de calcular o preço da embalagem de lacração mediante as combinações de Capacidade (`CapsulePlan` - 1GB a 50GB) e Faixa Estendida de Armazenamento (`TimeTier` - Short, Generation, Legacy).
- **Logística do S3 Glacier & Preemptive Restore:** Substituímos o fluxo ingênuo. Drafts upam arquivos nativamente em S3 padrão pelas `Presigned URLs` geradas pelo Back-end; Ao dar *Seal*, Java troca a AWS Storage class para `DEEP_ARCHIVE` (Glacier) num endpoint restrito. E, para proteger a experiência, colocamos um Bot (Scheduled Task `Cron`) vasculhando e mandando a AWS efetuar o Restore proativo apenas nas que vão estourar nos próximos T-48h.
- **Cinemática Baseada em Bytes e Elementos de Gelo:** Modificamos o motor frontal `CinematicCapsule.tsx`. Retiramos a verificação fútil de (MAX: 10 Itens) transacionando-a para validações precisas de soma de Payload Byte-to-Byte alimentando uma Barra Visual Orgânica. Embutimos visual de "Congelamento Relativo" gerando neve se os arquivos passarem de RESTORING forçadamente.

## 14 de Abril de 2026 - O Fio de Cobre: Identidade e Integração API (Fase 6)
Conectamos o Frontend ao Backend pela primeira vez de forma real, substituindo todos os mocks de identidade.

### O que implementamos
Portal de autenticação, Dashboard de Setup, roteamento real e Optimistic UI no upload de memórias.

### Resumo das Ações
- **Portal de Login Minimalista:** `page.tsx` virou a porta de entrada da Aevum. Usuário insere e-mail, bate em `POST /auth/login`, recebe UUID e sessão persiste via `AuthContext` (localStorage + React Context API).
- **AuthController + User Entity:** Backend criou a entidade `User`, `UserRepository` e o endpoint de login com lógica findOrCreate. CORS global via `WebMvcConfigurer`.
- **Dashboard de Setup:** `dashboard/page.tsx` com formulário de configuração de nova cápsula e estimativa dinâmica de preço via `POST /estimate`. Redireciona para o Baú após criação.
- **Rota do Baú (`/vault/[id]`):** O Baú Cinemático passou a morar em rota dinâmica. Carrega dados reais da cápsula pelo ID da URL via `GET /capsules/{id}`.
- **Optimistic UI no Upload:** Ao arremessar memória, a animação dispara instantaneamente, a barra de quota sobe. Em background, o Next.js pede a Presigned URL, faz o PUT para o S3 e confirma no banco via `POST /memories`. Em caso de erro, reverte o estado visual.

## 14 de Abril de 2026 - Infraestrutura Local e Multi-Cápsulas (Fase 7)
Pivotamos o ambiente para testes locais completos sem depender de AWS real, e habilitamos múltiplas cápsulas por usuário.

### O que implementamos
LocalStack para simular S3 local, refatoração JPA com relações formais e Dashboard multi-cápsula com galeria de cards.

### Resumo das Ações
- **LocalStack v3 (Community):** Adicionado ao `docker-compose.yml` na porta `4566`. Script `infra/localstack-init.sh` cria o bucket `aevum-storage-bucket` e configura CORS automaticamente no startup do container — zero config manual.
- **AwsConfig.java:** Bean central substituindo o construtor manual do `StorageService`. Detecta `aws.s3.endpoint` no YAML e aplica `endpointOverride` + `pathStyleAccessEnabled(true)` para o LocalStack. Em produção, basta remover a propriedade e o SDK usa a AWS real.
- **Refatoração JPA (User ↔ Capsule):** Removido o campo primitivo `String ownerId` da entidade `Capsule`. Introduzido `@ManyToOne User owner` com FK real `owner_id` no banco. `User` recebeu `@OneToMany List<Capsule>`. `CapsuleService` agora faz lookup do `User` antes de persistir qualquer cápsula.
- **Dashboard Multi-Cápsula:** Galeria de cards com animação de entrada escalonada. Cada card exibe título, herdeiro, plano, barra de progresso de quota e data de despertar. Botão "Forjar Nova Relíquia" expande um formulário inline com estimativa de preço dinâmica.
