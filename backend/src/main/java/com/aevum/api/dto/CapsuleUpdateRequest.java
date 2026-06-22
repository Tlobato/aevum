package com.aevum.api.dto;

import java.time.LocalDateTime;

public record CapsuleUpdateRequest(
        String title,
        String beneficiaryEmail,
        LocalDateTime unlockDate
) {}
