package com.aevum.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CapsuleCreateRequest(
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 150, message = "Title too long")
    String title,

    @Size(max = 500, message = "Description too long")
    String description,

    @NotNull(message = "Unlock date is required")
    @Future(message = "Unlock date must be in the future")
    LocalDateTime unlockDate,

    @NotBlank(message = "Recipient email is required")
    String recipientEmail,

    String themeId, // Optional field for the Capsule theme

    @NotNull(message = "Plan type is required")
    String planType,

    boolean isTestMode,

    // Indica se é um presente (true) ou cápsula pessoal (false)
    boolean isGift,

    // Mensagem especial do criador para o destinatário (apenas para presentes)
    @Size(max = 1000, message = "Owner message too long")
    String ownerMessage
) {}
