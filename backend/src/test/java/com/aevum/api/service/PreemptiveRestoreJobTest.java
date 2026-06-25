package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsulePlan;
import com.aevum.api.domain.CapsuleStatus;
import com.aevum.api.domain.StorageStatus;
import com.aevum.api.domain.User;
import com.aevum.api.repository.CapsuleRepository;
import com.aevum.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@Transactional
class PreemptiveRestoreJobTest {

    @Autowired
    private PreemptiveRestoreJob preemptiveRestoreJob;

    @Autowired
    private CapsuleRepository capsuleRepository;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private StorageService storageService;

    @MockitoBean
    private EmailService emailService;

    private User owner;

    @BeforeEach
    void setUp() {
        capsuleRepository.deleteAll();
        userRepository.deleteAll();

        owner = new User();
        owner.setId("user_owner_123");
        owner.setEmail("owner@example.com");
        owner = userRepository.save(owner);
    }

    @Test
    void testUnfreezeCapsules_whenWithin48h_shouldTriggerRestoreAndChangeStatusToRestoring() {
        // Criar cápsula selada congelada
        Capsule capsule = new Capsule();
        capsule.setOwner(owner);
        capsule.setTitle("Cápsula Quase Madura");
        capsule.setPlanType(CapsulePlan.CHRONOS_2GB);
        capsule.setRecipientEmail("recipient@example.com");
        // Desbloqueio em 36h a partir de agora no timezone America/Sao_Paulo (menor que 48h)
        ZoneId zoneId = ZoneId.of("America/Sao_Paulo");
        LocalDateTime unlockDate = ZonedDateTime.now(zoneId).plusHours(36).toLocalDateTime();
        capsule.setUnlockDate(unlockDate);
        capsule.setTargetTimezone("America/Sao_Paulo");
        capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(StorageStatus.FROZEN);
        capsule = capsuleRepository.save(capsule);

        preemptiveRestoreJob.unfreezeCapsules();

        // Verifica que o storageService.triggerRestoreTask foi invocado
        verify(storageService, times(1)).triggerRestoreTask(any(Capsule.class));

        // E o status de storage mudou para RESTORING
        Capsule updated = capsuleRepository.findById(capsule.getId()).orElseThrow();
        assertEquals(StorageStatus.RESTORING, updated.getStorageStatus());
    }

    @Test
    void testUnfreezeCapsules_whenBeyond48h_shouldNotTriggerRestore() {
        // Criar cápsula selada congelada
        Capsule capsule = new Capsule();
        capsule.setOwner(owner);
        capsule.setTitle("Cápsula Longínqua");
        capsule.setPlanType(CapsulePlan.CHRONOS_2GB);
        capsule.setRecipientEmail("recipient@example.com");
        // Desbloqueio em 72h a partir de agora (maior que 48h)
        ZoneId zoneId = ZoneId.of("America/Sao_Paulo");
        LocalDateTime unlockDate = ZonedDateTime.now(zoneId).plusHours(72).toLocalDateTime();
        capsule.setUnlockDate(unlockDate);
        capsule.setTargetTimezone("America/Sao_Paulo");
        capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(StorageStatus.FROZEN);
        capsule = capsuleRepository.save(capsule);

        preemptiveRestoreJob.unfreezeCapsules();

        // Não deve disparar o desgelo
        verify(storageService, never()).triggerRestoreTask(any(Capsule.class));

        Capsule updated = capsuleRepository.findById(capsule.getId()).orElseThrow();
        assertEquals(StorageStatus.FROZEN, updated.getStorageStatus());
    }

    @Test
    void testAwakenRipeCapsules_whenTimeArrived_shouldUnlock() {
        Capsule capsule = new Capsule();
        capsule.setOwner(owner);
        capsule.setTitle("Cápsula Pronta");
        capsule.setPlanType(CapsulePlan.CHRONOS_2GB);
        capsule.setRecipientEmail("recipient@example.com");
        // Desbloqueio no passado
        capsule.setUnlockDate(LocalDateTime.now().minusHours(1));
        capsule.setTargetTimezone("America/Sao_Paulo");
        capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(StorageStatus.AVAILABLE);
        capsule = capsuleRepository.save(capsule);

        preemptiveRestoreJob.awakenRipeCapsules();

        Capsule updated = capsuleRepository.findById(capsule.getId()).orElseThrow();
        assertEquals(CapsuleStatus.UNLOCKED, updated.getStatus());
    }

    @Test
    void testAwakenRipeCapsules_whenTimeNotArrived_shouldRemainSealed() {
        Capsule capsule = new Capsule();
        capsule.setOwner(owner);
        capsule.setTitle("Cápsula Ainda Não Pronta");
        capsule.setPlanType(CapsulePlan.CHRONOS_2GB);
        capsule.setRecipientEmail("recipient@example.com");
        // Desbloqueio amanhã
        capsule.setUnlockDate(LocalDateTime.now().plusDays(1));
        capsule.setTargetTimezone("America/Sao_Paulo");
        capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(StorageStatus.AVAILABLE);
        capsule = capsuleRepository.save(capsule);

        preemptiveRestoreJob.awakenRipeCapsules();

        Capsule updated = capsuleRepository.findById(capsule.getId()).orElseThrow();
        assertEquals(CapsuleStatus.SEALED, updated.getStatus());
    }

    @Test
    void testSendAwakeningEmails_respectingTimeAndFlag() {
        // Encontrar fusos que simulam antes e depois das 08h
        // UTC agora: ZonedDateTime.now(ZoneId.of("UTC"))
        ZonedDateTime utcNow = ZonedDateTime.now(ZoneId.of("UTC"));
        
        // Fuso 1: Fuso que agora está depois das 08h (ex: UTC + 10h em relação à hora UTC atual se ela for maior que -2h)
        // Usaremos offsets fixos para garantir robustez.
        // Calculamos um offset para garantir que no fuso A seja 09:00 e no fuso B seja 05:00
        int currentUtcHour = utcNow.getHour();
        
        // Fuso A (depois das 08:00, ex: 09:00): offset = 9 - currentUtcHour
        // Fuso B (antes das 08:00, ex: 05:00): offset = 5 - currentUtcHour
        
        String tzAfter8 = String.format("GMT%+d", 9 - currentUtcHour);
        String tzBefore8 = String.format("GMT%+d", 5 - currentUtcHour);

        // Cápsula 1 (fuso local >= 08h): deve enviar o e-mail
        Capsule capReady = new Capsule();
        capReady.setOwner(owner);
        capReady.setTitle("Desperta Cap 1");
        capReady.setPlanType(CapsulePlan.CHRONOS_2GB);
        capReady.setUnlockDate(LocalDateTime.now().minusDays(1));
        capReady.setRecipientEmail("recipient1@example.com");
        capReady.setTargetTimezone(tzAfter8);
        capReady.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capReady.setStatus(CapsuleStatus.UNLOCKED);
        capReady.setStorageStatus(StorageStatus.AVAILABLE);
        capReady.setAwakeningEmailSent(false);
        capReady = capsuleRepository.save(capReady);

        // Cápsula 2 (fuso local < 08h): não deve enviar (ficar retido)
        Capsule capRetained = new Capsule();
        capRetained.setOwner(owner);
        capRetained.setTitle("Retida Cap 2");
        capRetained.setPlanType(CapsulePlan.CHRONOS_2GB);
        capRetained.setUnlockDate(LocalDateTime.now().minusDays(1));
        capRetained.setRecipientEmail("recipient2@example.com");
        capRetained.setTargetTimezone(tzBefore8);
        capRetained.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capRetained.setStatus(CapsuleStatus.UNLOCKED);
        capRetained.setStorageStatus(StorageStatus.AVAILABLE);
        capRetained.setAwakeningEmailSent(false);
        capRetained = capsuleRepository.save(capRetained);

        preemptiveRestoreJob.sendAwakeningEmails();

        // Verifica que o e-mail foi enviado para a cápsula pronta
        verify(emailService, times(1)).sendAwakeningEmail(
                eq("recipient1@example.com"),
                eq("Desperta Cap 1"),
                any(),
                eq(capReady.getId()),
                any(),
                any()
        );

        // E a flag awakeningEmailSent mudou para true
        Capsule updatedReady = capsuleRepository.findById(capReady.getId()).orElseThrow();
        assertTrue(updatedReady.isAwakeningEmailSent());

        // Verifica que o e-mail NÃO foi enviado para a cápsula retida
        verify(emailService, never()).sendAwakeningEmail(
                eq("recipient2@example.com"),
                any(),
                any(),
                eq(capRetained.getId()),
                any(),
                any()
        );

        // E a flag da retida continua false
        Capsule updatedRetained = capsuleRepository.findById(capRetained.getId()).orElseThrow();
        assertFalse(updatedRetained.isAwakeningEmailSent());
    }
}
