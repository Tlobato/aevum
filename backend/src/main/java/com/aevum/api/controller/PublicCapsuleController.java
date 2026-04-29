package com.aevum.api.controller;

import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.dto.MemoryResponse;
import com.aevum.api.service.CapsuleService;
import com.aevum.api.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/capsules")
public class PublicCapsuleController {

    private final CapsuleService capsuleService;
    private final StorageService storageService;

    public PublicCapsuleController(CapsuleService capsuleService, StorageService storageService) {
        this.capsuleService = capsuleService;
        this.storageService = storageService;
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
}
