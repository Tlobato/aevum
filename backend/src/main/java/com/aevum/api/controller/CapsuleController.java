package com.aevum.api.controller;

import com.aevum.api.dto.CapsuleCreateRequest;
import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.dto.MemoryResponse;
import com.aevum.api.service.CapsuleService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/capsules")
public class CapsuleController {

    private static final Logger log = LoggerFactory.getLogger(CapsuleController.class);

    private final CapsuleService capsuleService;
    private final com.aevum.api.service.PricingService pricingService;
    private final com.aevum.api.service.StorageService storageService;

    // Lista de e-mails de administradores (ex: thyagollobato@gmail.com)
    @Value("${aevum.admin-emails:}")
    private String adminEmailsStr;

    // Lista de IDs de usuários administradores do Clerk (ex: user_3CxmnfILFnmHqllWZPvbMIQUjuG)
    @Value("${aevum.admin-user-ids:}")
    private String adminUserIdsStr;

    public CapsuleController(CapsuleService capsuleService,
                             com.aevum.api.service.PricingService pricingService,
                             com.aevum.api.service.StorageService storageService) {
        this.capsuleService = capsuleService;
        this.pricingService = pricingService;
        this.storageService = storageService;
    }

    /**
     * Verifica se o usuário autenticado é um administrador.
     * A checagem aceita tanto o e-mail quanto o ID do usuário (sub),
     * configurados via variáveis de ambiente separadas no Render.
     */
    private boolean isAdmin(Jwt jwt) {
        final String userId = jwt.getSubject();

        String rawEmail = jwt.getClaimAsString("email");
        if (rawEmail == null) rawEmail = jwt.getClaimAsString("primary_email_address");
        final String userEmail = rawEmail;

        log.debug("Checando permissão Admin — UserID: '{}' | Email: '{}'", userId, userEmail);

        boolean adminByEmail = !adminEmailsStr.isBlank() && userEmail != null &&
                Arrays.stream(adminEmailsStr.split(","))
                        .map(String::trim)
                        .anyMatch(e -> e.equalsIgnoreCase(userEmail));

        boolean adminById = !adminUserIdsStr.isBlank() && userId != null &&
                Arrays.stream(adminUserIdsStr.split(","))
                        .map(String::trim)
                        .anyMatch(id -> id.equalsIgnoreCase(userId));

        return adminByEmail || adminById;
    }

    @PostMapping
    public ResponseEntity<CapsuleResponse> createDraft(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CapsuleCreateRequest request) {

        String userId = jwt.getSubject();
        
        // Debug para entender o que o Clerk está enviando
        log.info("Extraindo dados do JWT - Claims: {}", jwt.getClaims());

        String userEmail = jwt.getClaimAsString("email");
        if (userEmail == null) userEmail = jwt.getClaimAsString("email_address");
        if (userEmail == null) userEmail = jwt.getClaimAsString("primary_email_address");
        
        if (userEmail == null) {
            log.warn("E-mail não encontrado nas claims padrões do Clerk para o usuário {}. Usando 'unknown'.", userId);
            userEmail = "unknown";
        }

        CapsuleResponse response = capsuleService.createDraft(request, userId, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/seal")
    public ResponseEntity<CapsuleResponse> sealCapsule(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {

        if (!isAdmin(jwt)) {
            log.warn("Acesso negado ao /seal para o usuário '{}'.", jwt.getSubject());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
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
    public ResponseEntity<CapsuleResponse> openCapsule(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        String userEmail = jwt.getClaimAsString("email");
        if (userEmail == null) userEmail = jwt.getClaimAsString("primary_email_address");
        CapsuleResponse response = capsuleService.openCapsule(id, jwt.getSubject(), userEmail);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCapsule(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {

        capsuleService.deleteCapsule(id, jwt.getSubject(), isAdmin(jwt), storageService);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/memories")
    public ResponseEntity<List<MemoryResponse>> getMemories(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        String userEmail = jwt.getClaimAsString("email");
        if (userEmail == null) userEmail = jwt.getClaimAsString("primary_email_address");
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
    public ResponseEntity<String> getPresignedUrl(
            @PathVariable UUID id,
            @RequestParam String fileName,
            @RequestParam long sizeBytes) {
        String url = storageService.generatePresignedUploadUrl(id.toString(), fileName, sizeBytes);
        return ResponseEntity.ok(url);
    }

    @GetMapping
    public ResponseEntity<List<CapsuleResponse>> listMyCapsules(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(capsuleService.listMyCapsules(jwt.getSubject()));
    }

    @PostMapping("/{id}/debug-unlock")
    public ResponseEntity<Void> forceUnlockCapsule(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        if (!isAdmin(jwt)) {
            log.warn("Acesso negado ao /debug-unlock para o usuário '{}'.", jwt.getSubject());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        capsuleService.earlyUnlockCapsule(id, storageService);
        return ResponseEntity.ok().build();
    }
}
