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

    public PreemptiveRestoreJob(CapsuleRepository capsuleRepository, StorageService storageService, EmailService emailService) {
        this.capsuleRepository = capsuleRepository;
        this.storageService = storageService;
        this.emailService = emailService;
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
    }

    // Executa a cada 10 segundos para testarmos localmente (em prod seria 0 0 0 * * ?)
    @Scheduled(cron = "0/10 * * * * ?") 
    public void awakenRipeCapsules() {
        // Busca cápsulas seladas que o tempo de destranca já chegou ou passou
        LocalDateTime now = LocalDateTime.now();
        // Para testes locais: vamos fingir que já avançamos 7 dias no futuro!
        LocalDateTime timeMachine = now.plusDays(7);

        List<Capsule> ripeCapsules = capsuleRepository.findAll().stream()
                .filter(c -> c.getStatus() == CapsuleStatus.SEALED)
                .filter(c -> c.getStorageStatus() != StorageStatus.AVAILABLE)
                .filter(c -> !c.getUnlockDate().isAfter(timeMachine))
                .toList();

        for (Capsule capsule : ripeCapsules) {
            log.info("O tempo chegou! Despertando a cápsula: {}", capsule.getId());
            try {
                // Aqui na vida real a AWS mudaria de RESTORING para AVAILABLE assincronamente, 
                // mas para MVP nós forçamos o status para AVAILABLE quando o tempo passa.
                capsule.setStorageStatus(StorageStatus.AVAILABLE);
                capsuleRepository.save(capsule);
                
                // Dispara o Mensageiro!
                emailService.sendAwakeningEmail(capsule);
            } catch (Exception e) {
                log.error("Falha ao despertar a cápsula {}", capsule.getId(), e);
            }
        }
    }
}
