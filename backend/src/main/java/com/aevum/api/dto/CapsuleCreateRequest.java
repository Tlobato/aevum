package com.aevum.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CapsuleCreateRequest(
    @NotBlank(message = "{capsule.title.notblank}")
    @Size(max = 150, message = "{capsule.title.size}")
    String title,

    @Size(max = 500, message = "{capsule.description.size}")
    String description,

    @NotNull(message = "{capsule.unlockDate.required}")
    @Future(message = "{capsule.unlockDate.future}")
    LocalDateTime unlockDate,

    @NotBlank(message = "{capsule.recipientEmail.notblank}")
    String recipientEmail,

    String themeId, // Optional field for the Capsule theme

    @NotNull(message = "{capsule.planType.required}")
    String planType,

    boolean isTestMode,

    // Indica se é um presente (true) ou cápsula pessoal (false)
    boolean isGift,

    // Mensagem especial do criador para o destinatário (apenas para presentes)
    @Size(max = 1000, message = "{capsule.ownerMessage.size}")
    String ownerMessage,

    String earlyUnlockRule,

    @NotBlank(message = "{capsule.targetTimezone.notblank}")
    String targetTimezone
) {}
