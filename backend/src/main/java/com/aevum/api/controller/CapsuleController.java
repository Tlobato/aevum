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

    public CapsuleController(CapsuleService capsuleService) {
        this.capsuleService = capsuleService;
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
        CapsuleResponse response = capsuleService.sealCapsule(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CapsuleResponse> openCapsule(@PathVariable UUID id) {
        CapsuleResponse response = capsuleService.openCapsule(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<CapsuleResponse>> listMyCapsules() {
        String mockOwnerId = "user_123";
        return ResponseEntity.ok(capsuleService.listMyCapsules(mockOwnerId));
    }
}
