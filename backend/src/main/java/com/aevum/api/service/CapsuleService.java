package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsuleStatus;
import com.aevum.api.domain.MemoryItem;
import com.aevum.api.domain.User;
import com.aevum.api.dto.CapsuleCreateRequest;
import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.exception.CapsuleLockedException;
import com.aevum.api.repository.CapsuleRepository;
import com.aevum.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CapsuleService {

    private final CapsuleRepository repository;
    private final UserRepository userRepository;

    public CapsuleService(CapsuleRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CapsuleResponse createDraft(CapsuleCreateRequest request, String userId) {
        if (request.unlockDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("A data de abertura deve estar no futuro.");
        }

        // Lookup real do usuário — lança exceção se não encontrado (não deveria acontecer)
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        Capsule capsule = new Capsule();
        if (request.themeId() != null && !request.themeId().isBlank()) {
            capsule.setThemeId(request.themeId());
        }
        capsule.setOwner(owner);
        capsule.setPlanType(com.aevum.api.domain.CapsulePlan.valueOf(request.planType()));
        capsule.setTitle(request.title());
        capsule.setDescription(request.description());
        capsule.setUnlockDate(request.unlockDate());
        capsule.setRecipientEmail(request.recipientEmail());
        capsule.setTestMode(request.isTestMode());
        capsule.setStatus(CapsuleStatus.DRAFT);
        capsule.setStorageStatus(com.aevum.api.domain.StorageStatus.DRAFT);

        capsule = repository.save(capsule);
        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional
    public CapsuleResponse sealCapsule(UUID id, com.aevum.api.service.StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        if (capsule.getStatus() != CapsuleStatus.DRAFT) {
            throw new IllegalArgumentException("Apenas cápsulas em rascunho podem ser seladas.");
        }

        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(com.aevum.api.domain.StorageStatus.FROZEN);
        capsule.setSealedAt(LocalDateTime.now());

        capsule = repository.save(capsule);

        // Trigger background or sync freeze to S3 Glacier
        storageService.freezeCapsuleFiles(capsule);

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public com.aevum.api.service.PricingService.PricingSummary calculateSummary(UUID id, com.aevum.api.service.PricingService pricingService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));
        return pricingService.calculateSealSummary(capsule);
    }

    @Transactional
    public CapsuleResponse addMemory(UUID id, com.aevum.api.dto.AddMemoryRequest request, String userId) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        // Valida que o usuário é o dono da cápsula
        if (!capsule.getOwnerId().equals(userId)) {
            throw new IllegalArgumentException("Você não tem permissão para adicionar memórias a esta cápsula.");
        }

        if (capsule.getStatus() != CapsuleStatus.DRAFT) {
            throw new IllegalArgumentException("Apenas cápsulas em rascunho podem receber memórias.");
        }

        long newTotalSize = capsule.getTotalSizeBytes() + request.sizeBytes();
        if (newTotalSize > capsule.getPlanType().getMaxSizeBytes()) {
            throw new IllegalArgumentException("Limite de armazenamento do plano excedido.");
        }
        capsule.setTotalSizeBytes(newTotalSize);

        MemoryItem item = new MemoryItem();
        item.setCapsule(capsule);
        item.setType(com.aevum.api.domain.ItemType.valueOf(request.type()));
        item.setContentPayload(request.textContent() != null ? request.textContent() : "");
        item.setFileName(request.fileName());
        item.setSizeBytes(request.sizeBytes());
        capsule.getItems().add(item);

        capsule = repository.save(capsule);
        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public CapsuleResponse openCapsule(UUID id) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        // A Regra de Ouro do Aevum protegendo as Memórias será aplicada no endpoint 
        // futuro de download de arquivos (ex: GET /capsules/{id}/memories), 
        // já que este endpoint principal devolve apenas metadados necessários para renderizar o baú 3D visualmente na UI.

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public List<CapsuleResponse> listMyCapsules(String userId) {
        return repository.findByOwner_Id(userId).stream()
                .map(CapsuleResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
