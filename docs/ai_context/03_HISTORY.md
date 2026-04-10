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
