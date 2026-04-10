## Status Atual do Desenvolvimento

### Fase 1: Scaffolding (Completo ✔️)
- [x] Inicialização do Frontend (Next.js + Tailwind + Framer Motion)
- [x] Inicialização do Backend (Spring Boot + GraalVM Native Image)
- [x] Setup do Monorepo

### Fase 2: Domínio e Persistência Java (Completo ✔️)
- [x] Definição de Entidades Principais (`Capsule`, `MemoryItem`)
- [x] Definição da Entidade de Guarda (`CapsuleGuardian`)
- [x] Repositórios Spring Data JPA
- [x] Modo Desenvolvedor Admin na modelagem (`isTestMode` boolean flag)

### Fase 3: Camada de API e Serviços (Completo ✔️)
- [x] Transações DTO isoladas (`CapsuleCreateRequest`, `CapsuleResponse`)
- [x] `CapsuleService`: Regra de Ouro implementada (Bloqueio Temporal `unlockDate`)
- [x] Endpoints REST (`POST /api/v1/capsules`, `POST /.../seal`, `GET /.../{id}`)
- [x] `GlobalExceptionHandler`: Interceptador 403 Forbidden para acesso prematuro
- [x] Adição do `spring-boot-starter-validation` ao Gradle

### Fase 4: O Frontend Tátil e Luxuoso (Completo ✔️)
- [x] Design System Global criado (`globals.css`) usando dark theme e Tailwind.
- [x] Construção do `CapsuleVault.tsx` contemplando Glassmorphism e botões interativos (Shimmer).
- [x] Componente mágico de Animação `MemoryDropzone.tsx` usando `framer-motion` (Drag and Drop virtual).
- [x] Nova Tela Inicial `page.tsx` construída conectando Título e Componentes Visuais com fontes minimalistas e luzes ambientes em CSS no Background.

*(Próximos passos previstos: Integração Axios do Tátil com a API Java / Setup Postgres Local)*
