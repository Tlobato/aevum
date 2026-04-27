package com.aevum.api.controller;

import com.aevum.api.service.CapsuleService;
import com.aevum.api.service.PricingService;
import com.aevum.api.service.StripeService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final CapsuleService capsuleService;
    private final PricingService pricingService;
    private final StripeService stripeService;
    private final com.aevum.api.service.StorageService storageService;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    public PaymentController(CapsuleService capsuleService, PricingService pricingService, StripeService stripeService, com.aevum.api.service.StorageService storageService) {
        this.capsuleService = capsuleService;
        this.pricingService = pricingService;
        this.stripeService = stripeService;
        this.storageService = storageService;
    }

    /**
     * O Frontend chama este endpoint ao clicar em "Selar e Pagar".
     * Retorna a URL de checkout do Stripe para redirecionar o cliente.
     */
    @PostMapping("/create-checkout/{capsuleId}")
    public ResponseEntity<Map<String, String>> createCheckout(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID capsuleId) {
        try {
            var summary = capsuleService.calculateSummary(capsuleId, pricingService);
            String checkoutUrl = stripeService.createCheckoutSession(
                    capsuleId.toString(),
                    summary.priceInCents(),
                    summary.planType()
            );
            return ResponseEntity.ok(Map.of("checkoutUrl", checkoutUrl));
        } catch (Exception e) {
            log.error("Erro ao criar checkout para cápsula {}", capsuleId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * O Frontend chama este endpoint ao clicar em "Quebrar Selo (Desbloqueio Antecipado)".
     */
    @PostMapping("/create-early-unlock-checkout/{capsuleId}")
    public ResponseEntity<Map<String, String>> createEarlyUnlockCheckout(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID capsuleId) {
        try {
            // Verifica permissão (se o usuário não for dono nem recipient, vai lançar exception)
            var response = capsuleService.openCapsule(capsuleId, jwt.getSubject(), jwt.getClaimAsString("email"));
            
            long penaltyInCents = capsuleService.calculateEarlyUnlockPenalty(capsuleId, pricingService);
            String checkoutUrl = stripeService.createEarlyUnlockCheckoutSession(
                    capsuleId.toString(),
                    penaltyInCents,
                    response.title()
            );
            return ResponseEntity.ok(Map.of("checkoutUrl", checkoutUrl));
        } catch (Exception e) {
            log.error("Erro ao criar checkout de multa para cápsula {}", capsuleId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Webhook do Stripe — Chamado automaticamente pelo Stripe quando o pagamento é confirmado.
     * NÃO requer autenticação JWT (vem do servidor do Stripe, não do navegador do usuário).
     * A segurança é feita pela assinatura HMAC do Stripe (webhookSecret).
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

            if ("checkout.session.completed".equals(event.getType())) {
                Session session = (Session) event.getDataObjectDeserializer()
                        .getObject()
                        .orElseThrow();

                String capsuleId = session.getMetadata().get("capsule_id");
                String action = session.getMetadata().get("action");

                if ("seal".equals(action)) {
                    log.info("Pagamento confirmado! Selando cápsula: {}", capsuleId);
                    capsuleService.sealCapsule(UUID.fromString(capsuleId), storageService);
                } else if ("early_unlock".equals(action)) {
                    log.info("Pagamento de multa confirmado! Quebrando selo da cápsula: {}", capsuleId);
                    capsuleService.earlyUnlockCapsule(UUID.fromString(capsuleId), storageService);
                } else {
                    log.warn("Ação desconhecida no webhook do Stripe: {}", action);
                }
            }

            return ResponseEntity.ok("ok");
        } catch (SignatureVerificationException e) {
            log.error("Assinatura do Stripe inválida!", e);
            return ResponseEntity.badRequest().body("Assinatura inválida");
        } catch (Exception e) {
            log.error("Erro ao processar webhook", e);
            return ResponseEntity.internalServerError().body("Erro interno");
        }
    }
}
