package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsuleStatus;
import com.aevum.api.domain.MemoryItem;
import com.aevum.api.dto.CapsuleCreateRequest;
import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.exception.CapsuleLockedException;
import com.aevum.api.repository.CapsuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CapsuleService {

    private final CapsuleRepository repository;

    public CapsuleService(CapsuleRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CapsuleResponse createDraft(CapsuleCreateRequest request, String ownerId) {
        if (request.unlockDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("A data de abertura deve estar no futuro.");
        }

        Capsule capsule = new Capsule();
        if (request.themeId() != null && !request.themeId().isBlank()) {
            capsule.setThemeId(request.themeId());
        }
        capsule.setOwnerId(ownerId);
        capsule.setTitle(request.title());
        capsule.setDescription(request.description());
        capsule.setUnlockDate(request.unlockDate());
        capsule.setRecipientEmail(request.recipientEmail());
        capsule.setTestMode(request.isTestMode());
        capsule.setStatus(CapsuleStatus.DRAFT);

        capsule = repository.save(capsule);
        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional
    public CapsuleResponse sealCapsule(UUID id) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        if (capsule.getStatus() != CapsuleStatus.DRAFT) {
            throw new IllegalArgumentException("Apenas cápsulas em rascunho podem ser seladas.");
        }

        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setSealedAt(LocalDateTime.now());
        
        capsule = repository.save(capsule);
        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional
    public CapsuleResponse addMemory(UUID id, com.aevum.api.dto.AddMemoryRequest request, String ownerId) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        if (!capsule.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("Você não tem permissão para adicionar memórias a esta cápsula.");
        }

        if (capsule.getStatus() != CapsuleStatus.DRAFT) {
            throw new IllegalArgumentException("Apenas cápsulas em rascunho podem receber memórias.");
        }

        MemoryItem item = new MemoryItem();
        item.setCapsule(capsule);
        item.setType(com.aevum.api.domain.ItemType.valueOf(request.type()));
        item.setContentPayload(request.textContent() != null ? request.textContent() : "");
        item.setFileName(request.fileName());
        capsule.getItems().add(item);

        capsule = repository.save(capsule);
        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public CapsuleResponse openCapsule(UUID id) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        // Regra de Ouro do Aevum:
        if (capsule.getStatus() == CapsuleStatus.SEALED && !capsule.isTestMode()) {
            if (LocalDateTime.now().isBefore(capsule.getUnlockDate())) {
                throw new CapsuleLockedException("Esta relíquia ainda está trancada no tempo. Retorne em: " + capsule.getUnlockDate());
            }
        }

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public List<CapsuleResponse> listMyCapsules(String ownerId) {
        return repository.findByOwnerId(ownerId).stream()
                .map(CapsuleResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
