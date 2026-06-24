package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsuleStatus;
import com.aevum.api.domain.StorageStatus;
import com.aevum.api.repository.CapsuleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class PreemptiveRestoreJob {

    private static final Logger log = LoggerFactory.getLogger(PreemptiveRestoreJob.class);

    private final CapsuleRepository capsuleRepository;
    private final StorageService storageService;
    private final EmailService emailService;
    private final CapsuleService capsuleService;

    public PreemptiveRestoreJob(CapsuleRepository capsuleRepository, StorageService storageService, EmailService emailService, CapsuleService capsuleService) {
        this.capsuleRepository = capsuleRepository;
        this.storageService = storageService;
        this.emailService = emailService;
        this.capsuleService = capsuleService;
    }

    @Scheduled(cron = "0 0 * * * *") 
    public void unfreezeCapsules() {
        log.info("Iniciando Job de Desgelo Preemptivo...");

        List<Capsule> sealedCapsules = capsuleRepository.findByStatus(CapsuleStatus.SEALED).stream()
                .filter(c -> c.getStorageStatus() == StorageStatus.FROZEN)
                .toList();

        for (Capsule capsule : sealedCapsules) {
            try {
                ZonedDateTime localNow = ZonedDateTime.now(ZoneId.of(capsule.getTargetTimezone()));
                ZonedDateTime localUnlock = ZonedDateTime.of(capsule.getUnlockDate(), ZoneId.of(capsule.getTargetTimezone()));
                
                if (localNow.plusHours(48).isAfter(localUnlock)) {
                    log.info("Solicitando Restore AWS Glacier para Cápsula: {}", capsule.getId());
                    storageService.triggerRestoreTask(capsule);
                    capsule.setStorageStatus(StorageStatus.RESTORING);
                    capsuleRepository.save(capsule);
                }
            } catch (Exception e) {
                log.error("Falha ao iniciar restore da cápsula {}", capsule.getId(), e);
            }
        }
        
        log.info("Job de Desgelo finalizado.");
        
        // Em seguida, varre e apaga os Rascunhos Abandonados
        try {
            capsuleService.cleanupAbandonedDrafts(storageService);
        } catch (Exception e) {
            log.error("Erro durante a limpeza de Rascunhos Abandonados", e);
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    public void checkRestoreStatus() {
        log.info("Iniciando Job de Verificação de Restore S3...");

        List<Capsule> restoringCapsules = capsuleRepository.findByStorageStatus(StorageStatus.RESTORING);

        for (Capsule capsule : restoringCapsules) {
            try {
                if (storageService.areFilesAvailable(capsule)) {
                    log.info("Arquivos restaurados e prontos no S3 para a cápsula: {}", capsule.getId());
                    capsule.setStorageStatus(StorageStatus.AVAILABLE);
                    capsuleRepository.save(capsule);
                }
            } catch (Exception e) {
                log.error("Erro ao verificar restore da cápsula {}", capsule.getId(), e);
            }
        }
        
        log.info("Job de Verificação de Restore finalizado.");
    }

    @Scheduled(cron = "0 0 * * * *")
    public void awakenRipeCapsules() {
        log.info("Iniciando Job de Despertar de Cápsulas Maduras...");

        List<Capsule> sealedCapsules = capsuleRepository.findByStatus(CapsuleStatus.SEALED).stream()
                .filter(c -> c.getStorageStatus() == StorageStatus.AVAILABLE)
                .toList();

        for (Capsule capsule : sealedCapsules) {
            try {
                ZonedDateTime localNow = ZonedDateTime.now(ZoneId.of(capsule.getTargetTimezone()));
                ZonedDateTime localUnlock = ZonedDateTime.of(capsule.getUnlockDate(), ZoneId.of(capsule.getTargetTimezone()));
                
                if (localNow.isAfter(localUnlock) || localNow.equals(localUnlock)) {
                    log.info("O tempo chegou! Desbloqueando a cápsula no site: {}", capsule.getId());
                    capsule.setStatus(CapsuleStatus.UNLOCKED);
                    capsuleRepository.save(capsule);
                }
            } catch (Exception e) {
                log.error("Falha ao despertar a cápsula {}", capsule.getId(), e);
            }
        }

        log.info("Job de Despertar finalizado.");
    }

    @Scheduled(cron = "0 0 * * * *")
    public void sendAwakeningEmails() {
        log.info("Iniciando Job de Disparo de E-mails de Despertar...");

        List<Capsule> unlockedCapsules = capsuleRepository.findByStatus(CapsuleStatus.UNLOCKED).stream()
                .filter(c -> !c.isAwakeningEmailSent())
                .filter(c -> c.getStorageStatus() == StorageStatus.AVAILABLE)
                .toList();

        for (Capsule capsule : unlockedCapsules) {
            try {
                ZonedDateTime localNow = ZonedDateTime.now(ZoneId.of(capsule.getTargetTimezone()));

                if (localNow.getHour() >= 8) {
                    log.info("Disparando e-mail de despertar para a cápsula: {}", capsule.getId());
                    emailService.sendAwakeningEmail(
                        capsule.getRecipientEmail(),
                        capsule.getTitle(),
                        capsule.getOwnerMessage(),
                        capsule.getId(),
                        capsule.getAccessToken(),
                        capsule.getLocale()
                    );
                    capsule.setAwakeningEmailSent(true);
                    capsuleRepository.save(capsule);
                }
            } catch (Exception e) {
                log.error("Falha ao disparar e-mail de despertar para a cápsula {}", capsule.getId(), e);
            }
        }
        
        log.info("Job de Disparo de E-mails finalizado.");
    }
}
