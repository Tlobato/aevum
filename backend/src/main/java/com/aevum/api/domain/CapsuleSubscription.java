package com.aevum.api.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "capsule_subscriptions")
public class CapsuleSubscription {

    @Id
    private UUID capsuleId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "capsule_id")
    private Capsule capsule;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status = SubscriptionStatus.TRIAL;

    @Enumerated(EnumType.STRING)
    private SubscriptionPlanType planType;

    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public CapsuleSubscription() {}

    public UUID getCapsuleId() {
        return capsuleId;
    }

    public void setCapsuleId(UUID capsuleId) {
        this.capsuleId = capsuleId;
    }

    public Capsule getCapsule() {
        return capsule;
    }

    public void setCapsule(Capsule capsule) {
        this.capsule = capsule;
        if (capsule != null) {
            this.capsuleId = capsule.getId();
        }
    }

    public SubscriptionStatus getStatus() {
        return status;
    }

    public void setStatus(SubscriptionStatus status) {
        this.status = status;
    }

    public SubscriptionPlanType getPlanType() {
        return planType;
    }

    public void setPlanType(SubscriptionPlanType planType) {
        this.planType = planType;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
