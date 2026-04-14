package com.aevum.api.controller;

import com.aevum.api.dto.CapsuleCreateRequest;
import com.aevum.api.dto.CapsuleResponse;
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
    public ResponseEntity<CapsuleResponse> createDraft(@Valid @RequestBody CapsuleCreateRequest request) {
        // TODO: In the future, ownerId will come from the Auth Token (e.g. JWT Principal)
        String mockOwnerId = "user_123"; 
        
        CapsuleResponse response = capsuleService.createDraft(request, mockOwnerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/seal")
    public ResponseEntity<CapsuleResponse> sealCapsule(@PathVariable UUID id) {
        CapsuleResponse response = capsuleService.sealCapsule(id, storageService);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/memories")
    public ResponseEntity<CapsuleResponse> addMemory(
            @PathVariable UUID id,
            @Valid @RequestBody com.aevum.api.dto.AddMemoryRequest request) {
        String mockOwnerId = "user_123";
        CapsuleResponse response = capsuleService.addMemory(id, request, mockOwnerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CapsuleResponse> openCapsule(@PathVariable UUID id) {
        CapsuleResponse response = capsuleService.openCapsule(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/calculate-seal")
    public ResponseEntity<com.aevum.api.service.PricingService.PricingSummary> calculateSeal(@PathVariable UUID id) {
        com.aevum.api.service.PricingService.PricingSummary summary = capsuleService.calculateSummary(id, pricingService);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{id}/presign")
    public ResponseEntity<String> getPresignedUrl(@PathVariable UUID id, @RequestParam String fileName, @RequestParam long sizeBytes) {
        // Assume user validation etc in real life
        String url = storageService.generatePresignedUploadUrl(id.toString(), fileName, sizeBytes);
        return ResponseEntity.ok(url);
    }

    @GetMapping
    public ResponseEntity<List<CapsuleResponse>> listMyCapsules() {
        String mockOwnerId = "user_123";
        return ResponseEntity.ok(capsuleService.listMyCapsules(mockOwnerId));
    }
}
