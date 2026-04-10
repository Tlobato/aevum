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
