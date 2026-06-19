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
    String status,
    String planType,
    String storageStatus,
    long totalSizeBytes,
    boolean isTestMode,
    boolean isGift,
    String ownerMessage,
    java.util.UUID accessToken,
    String earlyUnlockRule,
    String ownerId
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
            capsule.getStatus().name(),
            capsule.getPlanType().name(),
            capsule.getStorageStatus().name(),
            capsule.getTotalSizeBytes(),
            capsule.isTestMode(),
            capsule.isGift(),
            capsule.getOwnerMessage(),
            capsule.getAccessToken(),
            capsule.getEarlyUnlockRule().name(),
            capsule.getOwnerId()
        );
    }
}
