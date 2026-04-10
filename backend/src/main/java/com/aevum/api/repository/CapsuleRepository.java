package com.aevum.api.repository;

import com.aevum.api.domain.Capsule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CapsuleRepository extends JpaRepository<Capsule, UUID> {
    
    // Buscar todas as cápsulas pertencentes a um usuário específico
    List<Capsule> findByOwnerId(String ownerId);

    // Buscar cápsulas destinadas a um email
    List<Capsule> findByRecipientEmail(String recipientEmail);

    // BATCH / Cron jobs: Retornar todas as cápsulas que bateram a data de abertura e ainda estão seladas
    List<Capsule> findByUnlockDateBeforeAndStatus(LocalDateTime date, com.aevum.api.domain.CapsuleStatus status);
}
