# Status Atual do Projeto (Overview)

## Resumo Executivo
O projeto Aevum encontra-se com o **Frontend (MVP Visual) 100% finalizado e operante**. Estabelecemos um padrão ouro de UX focada em Retenção ("Game Feel") similar ao *Royal Match*, utilizando o poder do Next.js e Framer Motion. 

A arquitetura atual consegue não apenas renderizar objetos 2.5D sofisticados ("Cofres com absorção gravitacional de arquivos"), como interage diretamente com o hardware do usuário via `MediaDevices APIs` (Webcam e Microfone) nativamente no browser para criação ao vivo do legado sem recarregar a janela.

## 1. O que está concluído (Frontend - Face Visual)
- **Estrutura Next.js:** O coração da interface em `src/app/page.tsx` está operante.
- **Mecanismo de "Forja" (Criação Real-time Modal):**
  - Sistema de permissão Nativo WebRTC (Espelho de Webcam `video` e simulador de ondas de captura analógica).
  - Componentização Abstrata de *Uploads Multi-path* (O texto pode ser redigido localmente OU um `.pdf`/`.txt` pode ser anexado na mesma visão).
- **Mecanismo "A Bocada Mágica" (Física Animada):**
  - Implementado o sistema de _Asset Swapping_ em 0 delay, onde uma imagem `bau-fechado.png` é trocada pelo `bau-aberto.png` assim que o motor do Framer Motion finaliza os cálculos vetoriais em `X,Y,Z` do item engolido pela cápsula.

## 2. O que falta e Está Travado na Fila (O Próximo Passo Mestre)
**FASE 5: A Integração do Backend e Persistência Física**
- O Front-end agora gera eficientemente os objetos TypeScript (id, tipo de arquivo, File/Blob real renderizado) localmente na Memória RAM.
- **Qual a Missão:** Erguer um container **PostgreSQL** pelo Docker Desktop na máquina local.
- Alterar as configurações do Spring Boot (`application.properties`) para efetuar as criações automáticas das tabelas lógicas via JPA (`Capsule`, `MemoryItem`, `CapsuleGuardian`).
- Modificar o Next.js para enviar o objeto REST mapeado para nosso `CapsuleController` via Axios/Fetch no exato momento que o botão "FORJAR E ARREMESSAR" for instigado, transformando a experiência visual do browser em um registro definitivo salvo no HD.

## 3. Direcionamento e Assets em Confecção
- A equipe (Diretora de Arte) enviará os assets de Ícones de Relíquias (Carta, Fita, Foto, Rolo) exportados em `.png` puro para substituirmos as div's vetoriais coloridas feitas em CSS. 
- A estrutura de física está cega quanto as artes, e reagirá perfeitamente importando a gravidade para qualquer arquivo de arte jogado nela.
