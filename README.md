# Aevum - Digital Time Capsule

Aevum é um serviço de cápsula do tempo digital construído para durar gerações. Focado em uma experiência de usuário de luxo e na preservação segura de memórias a longo prazo usando armazenamento em Cloud otimizado e arquitetura Serverless.

## Estrutura do Monorepo

Este é um monorepo polyglot dividindo o frontend (Node.js/Next.js) e o backend (Java/Spring Boot Native). 

- `/frontend`: Aplicação Web desenvolvida com **Next.js**, estilizada com **Tailwind CSS** e animada com **Framer Motion**.
- `/backend`: API desenvolvida com **Spring Boot 3.x** e **Java 21**, compilada para **GraalVM Native Image** para redução extrema de custo computacional ao rodar em Cloud Serverless.

## Como Iniciar (Scaffolding)

### Backend
1. Navegue até a pasta `/backend`
2. Esta pasta já contém um pacote recém-gerado com Spring Boot utilizando: Web, Data JPA, PostgreSQL e GraalVM Native Support.
3. Para rodar: `./gradlew bootRun`

### Frontend 

Para rodar o frontend:
1. Navegue até a pasta `frontend`
2. Certifique-se de que o [Node.js](https://nodejs.org/) (recomendado v20+ LTS) está instalado – de preferência usando a versão LTS.
3. Instale as dependências caso ainda não tenha (rode `npm install`).
4. Inicie o servidor local de dev:
   ```bash
   npm run dev
   ```

---
*Construído para o Futuro.*
