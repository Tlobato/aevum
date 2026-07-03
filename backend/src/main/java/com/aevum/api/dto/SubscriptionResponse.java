package com.aevum.api.dto;

import com.aevum.api.domain.SubscriptionPlanType;
import com.aevum.api.domain.SubscriptionStatus;

import java.time.LocalDateTime;

public record SubscriptionResponse(
    SubscriptionStatus status,
    SubscriptionPlanType planType,
    LocalDateTime expiresAt,
    long daysRemaining
) {}
