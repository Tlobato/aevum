package com.aevum.api.controller;

import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.dto.MemoryResponse;
import com.aevum.api.service.CapsuleService;
import com.aevum.api.service.StorageService;
import com.aevum.api.service.PricingService;
import com.aevum.api.service.StripeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/capsules")
public class PublicCapsuleController {

    private static final Logger log = LoggerFactory.getLogger(PublicCapsuleController.class);

    private final CapsuleService capsuleService;
    private final StorageService storageService;
    private final PricingService pricingService;
    private final StripeService stripeService;

    public PublicCapsuleController(CapsuleService capsuleService, 
                                   StorageService storageService,
                                   PricingService pricingService,
                                   StripeService stripeService) {
        this.capsuleService = capsuleService;
        this.storageService = storageService;
        this.pricingService = pricingService;
        this.stripeService = stripeService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<CapsuleResponse> getPublicCapsule(
            @PathVariable UUID id,
            @RequestParam UUID token) {
        return ResponseEntity.ok(capsuleService.getPublicCapsule(id, token));
    }

    @GetMapping("/{id}/memories")
    public ResponseEntity<List<MemoryResponse>> getPublicMemories(
            @PathVariable UUID id,
            @RequestParam UUID token) {
        return ResponseEntity.ok(capsuleService.getPublicMemories(id, token, storageService));
    }

    @GetMapping("/{id}/early-unlock-penalty")
    public ResponseEntity<Map<String, Long>> getPublicEarlyUnlockPenalty(
            @PathVariable UUID id,
            @RequestParam UUID token) {
        CapsuleResponse response = capsuleService.getPublicCapsuleForEarlyUnlock(id, token);
        capsuleService.validateEarlyUnlockPermission(id, null, response.recipientEmail());
        
        long penaltyInCents = capsuleService.calculateEarlyUnlockPenalty(id, pricingService);
        return ResponseEntity.ok(Map.of("penaltyInCents", penaltyInCents));
    }

    @PostMapping("/{id}/create-early-unlock-checkout")
    public ResponseEntity<Map<String, String>> createPublicEarlyUnlockCheckout(
            @PathVariable UUID id,
            @RequestParam UUID token) {
        try {
            CapsuleResponse response = capsuleService.getPublicCapsuleForEarlyUnlock(id, token);
            capsuleService.validateEarlyUnlockPermission(id, null, response.recipientEmail());
            
            // Atualiza o idioma da cápsula com o idioma do momento do resgate
            String requestLocale = org.springframework.context.i18n.LocaleContextHolder.getLocale().toLanguageTag();
            capsuleService.updateLocale(id, requestLocale);
            
            long penaltyInCents = capsuleService.calculateEarlyUnlockPenalty(id, pricingService);
            String checkoutUrl = stripeService.createEarlyUnlockCheckoutSession(
                    id.toString(),
                    penaltyInCents,
                    response.title(),
                    response.recipientEmail()
            );
            return ResponseEntity.ok(Map.of("checkoutUrl", checkoutUrl));
        } catch (Exception e) {
            log.error("Erro ao criar checkout de resgate público para a cápsula {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
