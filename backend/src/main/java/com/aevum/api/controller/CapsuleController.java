package com.aevum.api.controller;

import com.aevum.api.dto.CapsuleCreateRequest;
import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.dto.MemoryResponse;
import com.aevum.api.service.CapsuleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/capsules")
public class CapsuleController {

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
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CapsuleCreateRequest request) {
        CapsuleResponse response = capsuleService.createDraft(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/seal")
    public ResponseEntity<CapsuleResponse> sealCapsule(@PathVariable UUID id) {
        CapsuleResponse response = capsuleService.sealCapsule(id, storageService);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/memories")
    public ResponseEntity<CapsuleResponse> addMemory(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID id,
            @Valid @RequestBody com.aevum.api.dto.AddMemoryRequest request) {
        CapsuleResponse response = capsuleService.addMemory(id, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CapsuleResponse> openCapsule(@PathVariable UUID id) {
        CapsuleResponse response = capsuleService.openCapsule(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/memories")
    public ResponseEntity<List<MemoryResponse>> getMemories(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID id) {
        List<MemoryResponse> memories = capsuleService.getMemoriesWithUrls(id, userId, storageService);
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
    public ResponseEntity<List<CapsuleResponse>> listMyCapsules(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(capsuleService.listMyCapsules(userId));
    }

    // Endpoint Exclusivo para Modo Desenvolvedor
    @PostMapping("/{id}/debug-unlock")
    public ResponseEntity<Void> forceUnlockCapsule(@PathVariable UUID id) {
        capsuleService.debugUnlockCapsule(id, storageService);
        return ResponseEntity.ok().build();
    }
}
