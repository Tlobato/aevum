package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsuleStatus;
import com.aevum.api.domain.MemoryItem;
import com.aevum.api.domain.User;
import com.aevum.api.dto.CapsuleCreateRequest;
import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.repository.CapsuleRepository;
import com.aevum.api.repository.UserRepository;
import com.aevum.api.dto.MemoryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CapsuleService {

    private static final Logger log = LoggerFactory.getLogger(CapsuleService.class);

    private final CapsuleRepository repository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public CapsuleService(CapsuleRepository repository, UserRepository userRepository, EmailService emailService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional
    public CapsuleResponse createDraft(CapsuleCreateRequest request, String userId, String userEmail) {
        if (request.unlockDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("A data de abertura deve estar no futuro.");
        }

        // Lazy creation do usuário vindo do Clerk (se não existir, cria na hora)
        User owner = userRepository.findById(userId)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setId(userId);
                    newUser.setEmail(userEmail);
                    return userRepository.save(newUser);
                });

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
        capsule.setGift(request.isGift());
        capsule.setOwnerMessage(request.ownerMessage());
        capsule.setAccessToken(java.util.UUID.randomUUID());
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

        capsule = repository.saveAndFlush(capsule);

        // Trigger background or sync freeze to S3 Glacier
        storageService.freezeCapsuleFiles(capsule);

        // Dispara e-mails de confirmação e presente (threads separadas)
        // Extraímos os dados antes para evitar LazyInitialization na thread do e-mail
        String ownerEmail = capsule.getOwner().getEmail();
        String capsuleTitle = capsule.getTitle();
        java.time.LocalDate unlockDate = capsule.getUnlockDate().toLocalDate();

        emailService.sendSealingConfirmation(ownerEmail, null, capsuleTitle, unlockDate);
        if (capsule.isGift()) {
            emailService.sendGiftNotification(capsule.getRecipientEmail(), capsuleTitle, unlockDate);
        }

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public com.aevum.api.service.PricingService.PricingSummary calculateSummary(UUID id,
            com.aevum.api.service.PricingService pricingService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));
        return pricingService.calculateSealSummary(capsule);
    }

    @Transactional(readOnly = true)
    public long calculateEarlyUnlockPenalty(UUID id, com.aevum.api.service.PricingService pricingService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));
        return pricingService.calculateEarlyUnlockPenaltyInCents(capsule);
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
    public CapsuleResponse openCapsule(UUID id, String userId, String userEmail) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        boolean isOwner = capsule.getOwnerId().equals(userId);
        boolean isRecipient = capsule.getRecipientEmail() != null && capsule.getRecipientEmail().equalsIgnoreCase(userEmail);

        if (!isOwner && !isRecipient) {
            throw new IllegalArgumentException("Acesso negado. Você não é o forjador nem o portador destinado desta cápsula.");
        }

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public CapsuleResponse getPublicCapsule(UUID id, UUID token) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cápsula não encontrada."));

        if (capsule.getAccessToken() == null || !capsule.getAccessToken().equals(token)) {
            throw new IllegalArgumentException("Token de acesso inválido.");
        }

        // Se não estiver em modo de teste, valida a data
        if (!capsule.isTestMode() && capsule.getUnlockDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("O tempo desta relíquia ainda não chegou.");
        }

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public List<MemoryResponse> getPublicMemories(UUID id, UUID token, com.aevum.api.service.StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cápsula não encontrada."));

        if (capsule.getAccessToken() == null || !capsule.getAccessToken().equals(token)) {
            throw new IllegalArgumentException("Token de acesso inválido.");
        }

        if (!capsule.isTestMode() && capsule.getUnlockDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("As memórias ainda estão seladas pelo tempo.");
        }

        if (capsule.getStorageStatus() != com.aevum.api.domain.StorageStatus.AVAILABLE) {
            throw new IllegalArgumentException("As memórias estão sendo preparadas para o despertar. Tente novamente em breve.");
        }

        return capsule.getItems().stream().map(item -> {
            String presignedUrl = null;
            if (item.getFileName() != null && !item.getFileName().isBlank()) {
                presignedUrl = storageService.generatePresignedGetUrl(capsule.getId().toString(), item.getFileName());
            }
            return MemoryResponse.fromEntity(item, presignedUrl);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MemoryResponse> getMemoriesWithUrls(UUID id, String userId, String userEmail, com.aevum.api.service.StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        boolean isOwner = capsule.getOwnerId().equals(userId);
        boolean isRecipient = capsule.getRecipientEmail() != null && capsule.getRecipientEmail().equalsIgnoreCase(userEmail);

        if (!isOwner && !isRecipient) {
            throw new IllegalArgumentException("Acesso negado às memórias desta cápsula.");
        }

        if (capsule.getStorageStatus() != com.aevum.api.domain.StorageStatus.AVAILABLE) {
            throw new IllegalArgumentException("As memórias ainda estão congeladas no tempo e não podem ser lidas.");
        }

        return capsule.getItems().stream().map(item -> {
            String presignedUrl = null;
            // Se for arquivo físico, gera a URL temporária no S3
            if (item.getFileName() != null && !item.getFileName().isBlank()) {
                presignedUrl = storageService.generatePresignedGetUrl(capsule.getId().toString(), item.getFileName());
            }
            return MemoryResponse.fromEntity(item, presignedUrl);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CapsuleResponse> listMyCapsules(String userId) {
        return repository.findByOwner_Id(userId).stream()
                .map(CapsuleResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void earlyUnlockCapsule(UUID id, com.aevum.api.service.StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Capsule not found"));

        if (capsule.getStatus() != com.aevum.api.domain.CapsuleStatus.SEALED) {
            log.warn("Tentativa de desbloqueio antecipado em cápsula com status inválido: {}", capsule.getStatus());
            return;
        }

        // Solicita o desgelo do Glacier (leva até 48h).
        // O storageStatus permanece FROZEN até o PreemptiveRestoreJob confirmar que está pronto.
        storageService.triggerRestoreTask(capsule);

        // Marca que o desgelo foi solicitado (o job diário vai marcar como AVAILABLE quando pronto)
        capsule.setStorageStatus(com.aevum.api.domain.StorageStatus.RESTORING);
        repository.save(capsule);

        log.info("Desbloqueio antecipado solicitado para cápsula {}. Desgelo iniciado no Glacier.", id);
    }

    public void cleanupAbandonedDrafts(StorageService storageService) {
        log.info("Iniciando varredura por rascunhos abandonados (DRAFT > 24h)...");
        LocalDateTime limit = LocalDateTime.now().minusHours(24);
        
        List<Capsule> abandoned = repository.findAll().stream()
                .filter(c -> c.getStatus() == com.aevum.api.domain.CapsuleStatus.DRAFT)
                .filter(c -> c.getCreatedAt().isBefore(limit))
                .toList();
                
        for (Capsule c : abandoned) {
            log.info("Limpando cápsula abandonada: {} (Dono: {})", c.getId(), c.getOwnerId());
            storageService.deleteDraftFolder(c.getId().toString());
            repository.delete(c);
        }
        log.info("Varredura concluída. {} cápsulas apagadas.", abandoned.size());
    }

    @Transactional
    public void deleteCapsule(UUID id, String userId, boolean isAdmin, StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cápsula não encontrada."));

        boolean isOwner = capsule.getOwnerId().equals(userId);

        if (!isAdmin && !isOwner) {
            throw new IllegalArgumentException("Você não tem permissão para apagar esta cápsula.");
        }

        if (capsule.getStatus() == CapsuleStatus.SEALED && !isAdmin) {
            throw new IllegalArgumentException("Apenas administradores podem apagar cápsulas já lacradas.");
        }

        log.info("Deletando cápsula {} (Solicitante: {} | Admin: {})", id, userId, isAdmin);

        // Limpeza na AWS
        storageService.deleteDraftFolder(id.toString());
        storageService.deleteSealedFolder(id.toString());

        repository.delete(capsule);
    }
}
