# ============================================================
# Backend Dockerfile — Multi-Stage Build
# Stage 1: Compila o JAR com Gradle
# Stage 2: Roda o JAR em uma JRE mínima (sem SDK completo)
# ============================================================

# Stage 1 — Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copia arquivos de configuração do Gradle primeiro (cache de dependências)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Baixa as dependências (camada cacheada enquanto build.gradle não mudar)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q || true

# Copia o código-fonte e compila
COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2 — Runtime (imagem mínima, sem SDK)
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Cria usuário não-root por segurança
RUN addgroup -S aevum && adduser -S aevum -G aevum

# Copia apenas o JAR gerado no stage anterior
COPY --from=builder /app/build/libs/*.jar app.jar

USER aevum

EXPOSE 8080

# Variáveis de ambiente são passadas pelo docker-compose ou pela plataforma de cloud
ENTRYPOINT ["java", "-jar", "app.jar"]
