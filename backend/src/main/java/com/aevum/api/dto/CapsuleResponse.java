package com.aevum.api.dto;

import com.aevum.api.domain.Capsule;

import java.time.LocalDateTime;
import java.util.UUID;

public record CapsuleResponse(
    UUID id,
    String themeId,
    String title,
    String description,
    LocalDateTime sealedAt,
    LocalDateTime unlockDate,
    String recipientEmail,
    String recipientName,
    String status,
    String planType,
    String storageStatus,
    long totalSizeBytes,
    boolean isTestMode,
    boolean isGift,
    String ownerMessage,
    java.util.UUID accessToken,
    String earlyUnlockRule,
    String ownerId,
    String ownerEmail,
    String targetTimezone
) {
    public static CapsuleResponse fromEntity(Capsule capsule) {
        return new CapsuleResponse(
            capsule.getId(),
            capsule.getThemeId(),
            capsule.getTitle(),
            capsule.getDescription(),
            capsule.getSealedAt(),
            capsule.getUnlockDate(),
            capsule.getRecipientEmail(),
            capsule.getRecipientName(),
            capsule.getStatus().name(),
            capsule.getPlanType().name(),
            capsule.getStorageStatus().name(),
            capsule.getTotalSizeBytes(),
            capsule.isTestMode(),
            capsule.isGift(),
            capsule.getOwnerMessage(),
            capsule.getAccessToken(),
            capsule.getEarlyUnlockRule().name(),
            capsule.getOwnerId(),
            capsule.getOwner() != null ? capsule.getOwner().getEmail() : null,
            capsule.getTargetTimezone()
        );
    }

    public CapsuleResponse sanitizeForRecipient(String requesterUserId) {
        boolean isOwner = this.ownerId != null && this.ownerId.equals(requesterUserId);
        boolean isUnlocked = "UNLOCKED".equals(this.status) || "OPENED".equals(this.status);
        
        if (!isOwner && !isUnlocked) {
            return new CapsuleResponse(
                id,
                themeId,
                title,
                description,
                sealedAt,
                unlockDate,
                recipientEmail,
                recipientName,
                status,
                planType,
                storageStatus,
                totalSizeBytes,
                isTestMode,
                isGift,
                null, // Oculta a mensagem surpresa do criador até abrir
                null, // Oculta o token de acesso público
                earlyUnlockRule,
                ownerId,
                ownerEmail,
                targetTimezone
            );
        }
        return this;
    }
}

