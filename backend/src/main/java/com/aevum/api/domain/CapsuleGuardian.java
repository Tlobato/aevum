package com.aevum.api.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "capsule_guardians")
public class CapsuleGuardian {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capsule_id", nullable = false)
    private Capsule capsule;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GuardianStatus status = GuardianStatus.PENDING_INVITE;

    // Se no futuro este guardião der o 'ok' para desenterrar a cápsula
    @Column(nullable = false)
    private boolean unlockApproved = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Capsule getCapsule() { return capsule; }
    public void setCapsule(Capsule capsule) { this.capsule = capsule; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public GuardianStatus getStatus() { return status; }
    public void setStatus(GuardianStatus status) { this.status = status; }
    public boolean isUnlockApproved() { return unlockApproved; }
    public void setUnlockApproved(boolean unlockApproved) { this.unlockApproved = unlockApproved; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
