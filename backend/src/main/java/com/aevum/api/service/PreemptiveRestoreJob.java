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

    // Executa diariamente à meia-noite (0 0 0 * * ?) -> Podemos setar para rodar a cada hora por precaução.
    @Scheduled(cron = "0 0 * * * *") 
    public void unfreezeCapsules() {
        log.info("Iniciando Job de Desgelo Preemptivo...");

        // Procurando cápsulas seladas, atualmente congeladas, que vão abrir nas próximas 48 horas.
        LocalDateTime threshold = LocalDateTime.now().plusHours(48);

        List<Capsule> capsulesToRestore = capsuleRepository.findAll().stream()
                .filter(c -> c.getStatus() == CapsuleStatus.SEALED)
                .filter(c -> c.getStorageStatus() == StorageStatus.FROZEN)
                .filter(c -> c.getUnlockDate().isBefore(threshold))
                .toList();

        for (Capsule capsule : capsulesToRestore) {
            log.info("Solicitando Restore AWS Glacier para Cápsula: {}", capsule.getId());
            
            try {
                storageService.triggerRestoreTask(capsule);
                capsule.setStorageStatus(StorageStatus.RESTORING);
                capsuleRepository.save(capsule);
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

    // Executa uma vez por dia, à meia-noite
    @Scheduled(cron = "0 0 0 * * ?")
    public void awakenRipeCapsules() {
        log.info("Iniciando Job de Despertar de Cápsulas Maduras...");

        // Busca cápsulas seladas cuja data de destranca já chegou ou passou
        LocalDateTime now = LocalDateTime.now();

        List<Capsule> ripeCapsules = capsuleRepository.findAll().stream()
                .filter(c -> c.getStatus() == CapsuleStatus.SEALED)
                .filter(c -> c.getStorageStatus() != StorageStatus.AVAILABLE)
                .filter(c -> !c.getUnlockDate().isAfter(now))
                .toList();

        for (Capsule capsule : ripeCapsules) {
            log.info("O tempo chegou! Despertando a cápsula: {}", capsule.getId());
            try {
                capsule.setStorageStatus(StorageStatus.AVAILABLE);
                capsuleRepository.save(capsule);

                // Dispara o Mensageiro!
                emailService.sendAwakeningEmail(
                    capsule.getRecipientEmail(),
                    capsule.getTitle(),
                    capsule.getOwnerMessage(),
                    capsule.getId(),
                    capsule.getAccessToken()
                );
            } catch (Exception e) {
                log.error("Falha ao despertar a cápsula {}", capsule.getId(), e);
            }
        }

        log.info("Job de Despertar finalizado. {} cápsulas acordadas.", ripeCapsules.size());
    }
}
