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
import org.springframework.security.oauth2.jwt.Jwt;

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
            throw new IllegalArgumentException("capsule.unlockDate.future");
        }

        // Busca o usuário no banco de dados local (deve ter sido criado previamente pelo Webhook do Clerk)
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("user.notfound"));

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
        capsule.setLocale(org.springframework.context.i18n.LocaleContextHolder.getLocale().toLanguageTag());

        if (request.earlyUnlockRule() != null && !request.earlyUnlockRule().isBlank()) {
            capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.valueOf(request.earlyUnlockRule()));
        } else {
            capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        }

        capsule = repository.save(capsule);
        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional
    public CapsuleResponse sealCapsule(UUID id, com.aevum.api.service.StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        if (capsule.getStatus() != CapsuleStatus.DRAFT) {
            throw new IllegalArgumentException("capsule.seal.onlyDraft");
        }

        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(com.aevum.api.domain.StorageStatus.FROZEN);
        capsule.setSealedAt(LocalDateTime.now());

        capsule = repository.saveAndFlush(capsule);

        // Trigger background or sync freeze to S3 Glacier
        storageService.freezeCapsuleFiles(capsule);

        // Dispara e-mails de confirmação e presente (threads separadas)
        // Extraímos os dados antes para evitar LazyInitialization na thread do e-mail
        String ownerEmail = (capsule.getOwner() != null) ? capsule.getOwner().getEmail() : null;
        String capsuleTitle = capsule.getTitle();
        java.time.LocalDate unlockDate = (capsule.getUnlockDate() != null) ? capsule.getUnlockDate().toLocalDate() : java.time.LocalDate.now();

        log.info("Tentando disparar e-mails para selagem. Dono: {}, Título: {}", ownerEmail, capsuleTitle);

        if (ownerEmail != null) {
            emailService.sendSealingConfirmation(ownerEmail, null, capsuleTitle, unlockDate, capsule.isGift(), capsule.getRecipientEmail(), capsule.getId(), capsule.getLocale());
        } else {
            log.warn("Não foi possível enviar e-mail de confirmação: Dono sem e-mail cadastrado.");
        }

        if (capsule.isGift() && capsule.getRecipientEmail() != null) {
            emailService.sendGiftNotification(capsule.getRecipientEmail(), capsuleTitle, unlockDate, capsule.getId(), capsule.getLocale());
        }

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public com.aevum.api.service.PricingService.PricingSummary calculateSummary(UUID id,
            com.aevum.api.service.PricingService pricingService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));
        return pricingService.calculateSealSummary(capsule);
    }

    @Transactional(readOnly = true)
    public long calculateEarlyUnlockPenalty(UUID id, com.aevum.api.service.PricingService pricingService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));
        return pricingService.calculateEarlyUnlockPenaltyInCents(capsule);
    }

    @Transactional
    public CapsuleResponse addMemory(UUID id, com.aevum.api.dto.AddMemoryRequest request, String userId) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        // Valida que o usuário é o dono da cápsula
        if (!capsule.getOwnerId().equals(userId)) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.memory.noPermission");
        }

        if (capsule.getStatus() != CapsuleStatus.DRAFT) {
            throw new IllegalArgumentException("capsule.memory.onlyDraft");
        }

        long newTotalSize = capsule.getTotalSizeBytes() + request.sizeBytes();
        if (newTotalSize > capsule.getPlanType().getMaxSizeBytes()) {
            throw new IllegalArgumentException("capsule.limit.exceeded");
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
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        boolean isOwner = capsule.getOwnerId().equals(userId);
        boolean isRecipient = capsule.getRecipientEmail() != null && capsule.getRecipientEmail().equalsIgnoreCase(userEmail);

        if (!isOwner && !isRecipient) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.access.denied");
        }

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public CapsuleResponse getPublicCapsule(UUID id, UUID token) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        if (capsule.getAccessToken() == null || !capsule.getAccessToken().equals(token)) {
            throw new IllegalArgumentException("capsule.token.invalid");
        }

        // Se não estiver em modo de teste, valida a data
        if (!capsule.isTestMode() && capsule.getUnlockDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("capsule.unlockDate.notYet");
        }

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public List<MemoryResponse> getPublicMemories(UUID id, UUID token, com.aevum.api.service.StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        if (capsule.getAccessToken() == null || !capsule.getAccessToken().equals(token)) {
            throw new IllegalArgumentException("capsule.token.invalid");
        }

        if (!capsule.isTestMode() && capsule.getUnlockDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("capsule.memories.sealed");
        }

        if (capsule.getStorageStatus() != com.aevum.api.domain.StorageStatus.AVAILABLE) {
            throw new IllegalArgumentException("capsule.memories.restoring");
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
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        boolean isOwner = capsule.getOwnerId().equals(userId);
        boolean isRecipient = capsule.getRecipientEmail() != null && capsule.getRecipientEmail().equalsIgnoreCase(userEmail);

        if (!isOwner && !isRecipient) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.memories.denied");
        }

        if (capsule.getStorageStatus() != com.aevum.api.domain.StorageStatus.AVAILABLE) {
            throw new IllegalArgumentException("capsule.memories.frozen");
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
    public void updateLocale(UUID id, String locale) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));
        if (locale != null && !locale.isBlank()) {
            capsule.setLocale(locale);
            repository.save(capsule);
            log.info("Locale da cápsula {} atualizado no checkout para: {}", id, locale);
        }
    }

    @Transactional
    public void earlyUnlockCapsule(UUID id, com.aevum.api.service.StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

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
            storageService.deleteSealedFolder(c.getId().toString());
            repository.delete(c);
        }
        log.info("Varredura concluída. {} cápsulas apagadas.", abandoned.size());
    }

    @Transactional
    public void deleteCapsule(UUID id, String userId, boolean isAdmin, StorageService storageService) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        boolean isOwner = capsule.getOwnerId().equals(userId);

        if (!isAdmin && !isOwner) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.delete.noPermission");
        }

        if (capsule.getStatus() == CapsuleStatus.SEALED && !isAdmin) {
            throw new IllegalArgumentException("capsule.delete.adminOnly");
        }

        log.info("Deletando cápsula {} (Solicitante: {} | Admin: {})", id, userId, isAdmin);

        // Limpeza na AWS
        storageService.deleteDraftFolder(id.toString());
        storageService.deleteSealedFolder(id.toString());

        repository.delete(capsule);
    }

    @Transactional(readOnly = true)
    public CapsuleResponse getPublicCapsuleForEarlyUnlock(UUID id, UUID token) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        if (capsule.getAccessToken() == null || !capsule.getAccessToken().equals(token)) {
            throw new IllegalArgumentException("capsule.token.invalid");
        }

        return CapsuleResponse.fromEntity(capsule);
    }

    @Transactional(readOnly = true)
    public void validateEarlyUnlockPermission(UUID id, String userId, String userEmail) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        boolean isOwner = userId != null && capsule.getOwnerId().equals(userId);
        boolean isRecipient = userEmail != null && capsule.getRecipientEmail() != null && capsule.getRecipientEmail().equalsIgnoreCase(userEmail);

        if (!isOwner && !isRecipient) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.access.denied");
        }

        com.aevum.api.domain.EarlyUnlockRule rule = capsule.getEarlyUnlockRule();
        if (rule == com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.earlyUnlock.blocked");
        }

        if (rule == com.aevum.api.domain.EarlyUnlockRule.CREATOR_ONLY && !isOwner) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.earlyUnlock.creatorOnly");
        }
    }

    @Transactional(readOnly = true)
    public void validateOwnership(UUID id, String userId) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));
        if (!capsule.getOwnerId().equals(userId)) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.access.denied");
        }
    }

    private void validateClerkReverification(Jwt jwt) {
        // Clerk session reverification:
        // A claim 'fva' (factor verification age) é um array de números [firstFactorAge, secondFactorAge].
        // Representa em minutos o tempo desde a última verificação de fatores do usuário.
        // Se fva for nulo, vazio, ou a idade do fator for >= 10 minutos (limite 'strict' padrão), lançamos a exceção.
        java.util.List<?> fvaList = jwt.getClaim("fva");
        if (fvaList == null || fvaList.isEmpty()) {
            log.warn("Re-autenticação do Clerk ausente: claim 'fva' não encontrada ou vazia no token do usuário {}. " +
                     "Caso use um JWT Template customizado (como 'aevum-session'), certifique-se de mapear a claim " +
                     "\"fva\": \"{{session.fva}}\" nas configurações do template no painel do Clerk.", jwt.getSubject());
            throw new com.aevum.api.exception.ClerkReverificationRequiredException("Reverification required");
        }

        Object firstFactorObj = fvaList.get(0);
        if (firstFactorObj instanceof Number number) {
            long minutesSinceVerification = number.longValue();
            log.info("Idade da verificação do primeiro fator do Clerk (fva[0]): {} minutos para o usuário {}", minutesSinceVerification, jwt.getSubject());
            if (minutesSinceVerification < 0 || minutesSinceVerification >= 10) {
                throw new com.aevum.api.exception.ClerkReverificationRequiredException("Reverification required");
            }
        } else {
            log.warn("Formato inválido do claim 'fva' no token do usuário {}", jwt.getSubject());
            throw new com.aevum.api.exception.ClerkReverificationRequiredException("Reverification required");
        }
    }

    @Transactional
    public CapsuleResponse updateCapsule(UUID id, com.aevum.api.dto.CapsuleUpdateRequest request, Jwt jwt) {
        Capsule capsule = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("capsule.notfound"));

        final String userId = jwt.getSubject();

        // Valida se o solicitante é o dono da cápsula
        if (!capsule.getOwnerId().equals(userId)) {
            throw new com.aevum.api.exception.AccessDeniedException("capsule.access.denied");
        }

        if (capsule.getStatus() == com.aevum.api.domain.CapsuleStatus.DRAFT) {
            // Permite alterar tudo
            if (request.title() != null && !request.title().isBlank()) {
                capsule.setTitle(request.title());
            }
            if (request.beneficiaryEmail() != null && !request.beneficiaryEmail().isBlank()) {
                capsule.setRecipientEmail(request.beneficiaryEmail());
            }
            if (request.unlockDate() != null) {
                if (request.unlockDate().isBefore(LocalDateTime.now())) {
                    throw new IllegalArgumentException("capsule.unlockDate.future");
                }
                capsule.setUnlockDate(request.unlockDate());
            }
            capsule = repository.save(capsule);
        } else if (capsule.getStatus() == com.aevum.api.domain.CapsuleStatus.SEALED) {
            // Se tentar alterar título ou data de destranca, bloqueia
            if ((request.title() != null && !request.title().isBlank()) || request.unlockDate() != null) {
                throw new IllegalArgumentException("capsule.already.sealed");
            }

            // Exige e valida re-autenticação do Clerk para alterar destinatário de cápsula selada
            validateClerkReverification(jwt);

            // Se alterar destinatário, permite
            if (request.beneficiaryEmail() != null && !request.beneficiaryEmail().isBlank()) {
                String oldEmail = capsule.getRecipientEmail();
                String newEmail = request.beneficiaryEmail();
                
                if (!newEmail.equalsIgnoreCase(oldEmail)) {
                    capsule.setRecipientEmail(newEmail);
                    capsule = repository.save(capsule);
                    
                    // Dispara e-mail de alerta para o dono da cápsula
                    String ownerEmail = capsule.getOwner() != null ? capsule.getOwner().getEmail() : null;
                    if (ownerEmail != null) {
                        emailService.sendSecurityAlertEmail(
                            ownerEmail,
                            capsule.getTitle(),
                            oldEmail != null ? oldEmail : "nenhum",
                            newEmail,
                            capsule.getLocale()
                        );
                    }
                    
                    // Se for um presente, notifica o NOVO destinatário
                    if (capsule.isGift()) {
                        java.time.LocalDate unlockLocalDate = capsule.getUnlockDate() != null ? capsule.getUnlockDate().toLocalDate() : java.time.LocalDate.now();
                        emailService.sendGiftNotification(
                            newEmail,
                            capsule.getTitle(),
                            unlockLocalDate,
                            capsule.getId(),
                            capsule.getLocale()
                        );
                    }
                }
            }
        }
        
        return CapsuleResponse.fromEntity(capsule);
    }
}
