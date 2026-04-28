package com.aevum.api.controller;

import com.aevum.api.dto.CapsuleCreateRequest;
import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.dto.MemoryResponse;
import com.aevum.api.service.CapsuleService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/capsules")
public class CapsuleController {

    private static final Logger log = LoggerFactory.getLogger(CapsuleController.class);

    private final CapsuleService capsuleService;
    private final com.aevum.api.service.PricingService pricingService;
    private final com.aevum.api.service.StorageService storageService;

    public CapsuleController(CapsuleService capsuleService, 
                             com.aevum.api.service.PricingService pricingService,
                             com.aevum.api.service.StorageService storageService) {
        this.capsuleService = capsuleService;
        this.pricingService = pricingService;
        this.storageService = storageService;
    }

    @PostMapping
    public ResponseEntity<CapsuleResponse> createDraft(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CapsuleCreateRequest request) {
        
        String userId = jwt.getSubject();
        
        // Clerk places primary email in the JWT claims under the "email" property if configured, 
        // or we can extract it if needed. However, since the user already exists in JIT,
        // we can just fall back to getting it from claims. Clerk usually puts it under "email" or "email_addresses".
        // Let's use getClaimAsString("email") if available, otherwise unknown.
        String userEmail = jwt.getClaimAsString("email");
        if (userEmail == null) userEmail = "unknown";
        
        CapsuleResponse response = capsuleService.createDraft(request, userId, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/seal")
    public ResponseEntity<CapsuleResponse> sealCapsule(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        
        // Log de diagnóstico para entender o que o Clerk envia no JWT em produção
        log.info("JWT claims recebidos no /seal: {}", jwt.getClaims().keySet());
        
        // O Clerk pode enviar o email em diferentes claims dependendo da configuração
        String extractedEmail = jwt.getClaimAsString("email");
        if (extractedEmail == null) extractedEmail = jwt.getClaimAsString("primary_email_address");
        
        final String finalUserEmail = extractedEmail;

        if (finalUserEmail == null) {
            log.warn("Claim 'email' não encontrado no JWT. Claims disponíveis: {}", jwt.getClaims());
        }
        
        log.info("Email extraído do JWT: '{}' | Admin emails configurados: '{}'", finalUserEmail, adminEmailsStr);
        
        boolean isAdmin = finalUserEmail != null && !adminEmailsStr.isBlank() 
                && List.of(adminEmailsStr.split(",")).stream()
                        .map(String::trim)
                        .anyMatch(e -> e.equalsIgnoreCase(finalUserEmail));
        
        if (!isAdmin) {
            log.warn("Acesso negado ao /seal. Email '{}' não está na lista de admins.", finalUserEmail);
            return ResponseEntity.status(403).build();
        }

        CapsuleResponse response = capsuleService.sealCapsule(id, storageService);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/memories")
    public ResponseEntity<CapsuleResponse> addMemory(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody com.aevum.api.dto.AddMemoryRequest request) {
        CapsuleResponse response = capsuleService.addMemory(id, request, jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CapsuleResponse> openCapsule(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        String userEmail = jwt.getClaimAsString("email");
        if (userEmail == null) userEmail = jwt.getClaimAsString("primary_email_address");
        CapsuleResponse response = capsuleService.openCapsule(id, jwt.getSubject(), userEmail);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCapsule(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        
        String extractedEmail = jwt.getClaimAsString("email");
        if (extractedEmail == null) extractedEmail = jwt.getClaimAsString("primary_email_address");
        
        final String finalUserEmail = extractedEmail;
        
        boolean isAdmin = finalUserEmail != null && !adminEmailsStr.isBlank() 
                && List.of(adminEmailsStr.split(",")).stream()
                        .map(String::trim)
                        .anyMatch(e -> e.equalsIgnoreCase(finalUserEmail));

        capsuleService.deleteCapsule(id, jwt.getSubject(), isAdmin, storageService);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/memories")
    public ResponseEntity<List<MemoryResponse>> getMemories(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        String userEmail = jwt.getClaimAsString("email");
        if (userEmail == null) userEmail = "unknown";
        List<MemoryResponse> memories = capsuleService.getMemoriesWithUrls(id, jwt.getSubject(), userEmail, storageService);
        return ResponseEntity.ok(memories);
    }

    @GetMapping("/{id}/calculate-seal")
    public ResponseEntity<com.aevum.api.service.PricingService.PricingSummary> calculateSeal(@PathVariable UUID id) {
        com.aevum.api.service.PricingService.PricingSummary summary = capsuleService.calculateSummary(id, pricingService);
        return ResponseEntity.ok(summary);
    }

    public record EstimateRequest(String planType, java.time.LocalDateTime unlockDate) {}

    @PostMapping("/estimate")
    public ResponseEntity<com.aevum.api.service.PricingService.PricingSummary> estimatePrice(@RequestBody EstimateRequest request) {
        com.aevum.api.domain.CapsulePlan plan = com.aevum.api.domain.CapsulePlan.valueOf(request.planType());
        com.aevum.api.domain.TimeTier timeTier = com.aevum.api.domain.TimeTier.determineTier(request.unlockDate());
        long price = pricingService.calculatePriceInCents(plan, timeTier);

        com.aevum.api.service.PricingService.PricingSummary summary = new com.aevum.api.service.PricingService.PricingSummary(
                plan.name(),
                plan.getMaxSizeBytes(),
                0L,
                timeTier.name(),
                request.unlockDate(),
                price
        );
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{id}/presign")
    public ResponseEntity<String> getPresignedUrl(@PathVariable UUID id, @RequestParam String fileName, @RequestParam long sizeBytes) {
        // Assume user validation etc in real life
        String url = storageService.generatePresignedUploadUrl(id.toString(), fileName, sizeBytes);
        return ResponseEntity.ok(url);
    }

    @GetMapping
    public ResponseEntity<List<CapsuleResponse>> listMyCapsules(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(capsuleService.listMyCapsules(jwt.getSubject()));
    }

    @Value("${aevum.admin-emails:}")
    private String adminEmailsStr;

    // O POST /debug-unlock agora é usado tanto para o bypass (admin) quanto para o sucesso do frontend (Stripe fallback)
    @PostMapping("/{id}/debug-unlock")
    public ResponseEntity<Void> forceUnlockCapsule(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        
        String userEmail = jwt.getClaimAsString("email");
        boolean isAdmin = userEmail != null && List.of(adminEmailsStr.split(",")).contains(userEmail);
        
        if (!isAdmin) {
            return ResponseEntity.status(403).build(); // Forbidden
        }

        capsuleService.earlyUnlockCapsule(id, storageService);
        return ResponseEntity.ok().build();
    }
}
