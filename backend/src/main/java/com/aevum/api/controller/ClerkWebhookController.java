package com.aevum.api.controller;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.svix.Webhook;
import com.svix.exceptions.WebhookVerificationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
public class ClerkWebhookController {

    private static final Logger log = LoggerFactory.getLogger(ClerkWebhookController.class);

    private final String webhookSecret;
    private final com.aevum.api.repository.UserRepository userRepository;
    private final com.aevum.api.service.EmailService emailService;

    public ClerkWebhookController(
            @Value("${clerk.webhook.secret}") String webhookSecret,
            com.aevum.api.repository.UserRepository userRepository,
            com.aevum.api.service.EmailService emailService) {
        this.webhookSecret = webhookSecret;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @PostMapping("/clerk")
    public ResponseEntity<String> handleClerkWebhook(
            @RequestBody String payload,
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature) {

        log.info("Recebida chamada de Webhook do Clerk. Svix-Id: {}", svixId);

        try {
            // Inicializa a validação do Svix
            Webhook webhook = new Webhook(webhookSecret);
            
            // Monta o mapa de cabeçalhos esperado pelo Svix SDK
            java.util.Map<String, java.util.List<String>> svixHeaders = new java.util.HashMap<>();
            svixHeaders.put("svix-id", java.util.List.of(svixId));
            svixHeaders.put("svix-timestamp", java.util.List.of(svixTimestamp));
            svixHeaders.put("svix-signature", java.util.List.of(svixSignature));

            // Verifica a assinatura; se for inválida, lança WebhookVerificationException
            webhook.verify(payload, svixHeaders);
        } catch (WebhookVerificationException e) {
            log.error("Falha na validação da assinatura do Webhook do Clerk: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature verification failed");
        } catch (Exception e) {
            log.error("Erro inesperado ao validar assinatura do Webhook do Clerk: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Verification error");
        }

        try {
            // Parseia o JSON recebido usando Gson
            JsonObject json = JsonParser.parseString(payload).getAsJsonObject();
            String eventType = json.has("type") ? json.get("type").getAsString() : "";
            JsonObject data = json.has("data") ? json.getAsJsonObject("data") : new JsonObject();

            String userId = data.has("id") ? data.get("id").getAsString() : "unknown";

            // Extrai o e-mail primário se disponível
            String email = "unknown";
            if (data.has("email_addresses") && data.get("email_addresses").isJsonArray()) {
                var emails = data.getAsJsonArray("email_addresses");
                if (emails.size() > 0) {
                    JsonObject firstEmail = emails.get(0).getAsJsonObject();
                    if (firstEmail.has("email_address")) {
                        email = firstEmail.get("email_address").getAsString();
                    }
                }
            }

            // Estrutura de tratamento baseada no tipo de evento
            switch (eventType) {
                case "user.created":
                    log.info("Webhook Clerk: Cadastrando usuário ativo ID: {} | Email: {}", userId, email);
                    com.aevum.api.domain.User newUser = new com.aevum.api.domain.User();
                    newUser.setId(userId);
                    newUser.setEmail(email);
                    newUser.setPlanType("PAY_PER_USE");
                    userRepository.save(newUser);
                    
                    // Dispara e-mail assíncrono de boas-vindas
                    emailService.sendWelcomeEmail(email, null);
                    break;
                case "user.updated":
                    log.info("Webhook Clerk: Atualizando e-mail do usuário ID: {} | Novo Email: {}", userId, email);
                    final String userEmailFinal = email;
                    userRepository.findById(userId).ifPresent(user -> {
                        user.setEmail(userEmailFinal);
                        userRepository.save(user);
                        log.info("Webhook Clerk: Usuário {} atualizado no banco de dados local.", userId);
                    });
                    break;
                default:
                    log.info("Webhook Clerk: Evento ignorado '{}' para o ID: {}", eventType, userId);
                    break;
            }

            return ResponseEntity.ok("Event processed successfully");
        } catch (Exception e) {
            log.error("Erro ao analisar dados do Webhook do Clerk", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing payload");
        }
    }
}
