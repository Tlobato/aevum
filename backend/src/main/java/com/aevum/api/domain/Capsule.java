package com.aevum.api.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "capsules")
public class Capsule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String themeId = "bau-classico";

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

    // Quando o usuário apertou "Selar Cápsula"
    private LocalDateTime sealedAt;

    // A data onde a cápsula volta a ficar acessível magicamente
    @Column(nullable = false)
    private LocalDateTime unlockDate;

    // O e-mail de quem será notificado e terá acesso.
    @Column(nullable = false)
    private String recipientEmail;

    // Indica se a cápsula é um presente para outra pessoa (vs. uma cápsula pessoal)
    @Column(nullable = false)
    private boolean isGift = false;

    // Mensagem especial do criador para o destinatário (visível apenas ao abrir)
    @Column(columnDefinition = "TEXT")
    private String ownerMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CapsuleStatus status = CapsuleStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StorageStatus storageStatus = StorageStatus.DRAFT;

    // Token único para acesso público do destinatário (sem login)
    @Column(unique = true)
    private java.util.UUID accessToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CapsulePlan planType = CapsulePlan.EPOCH_1GB;

    @Column(nullable = false)
    private long totalSizeBytes = 0L;

    // Flag especial para nós podermos simular "viagem no tempo"
    // ou acessar antes da data sem ferir a regra das cápsulas reais
    @Column(nullable = false)
    private boolean isTestMode = false;

    @OneToMany(mappedBy = "capsule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MemoryItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "capsule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CapsuleGuardian> guardians = new ArrayList<>();

    // Data de criação e última atualização (Auditoria básica)
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

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    // Helper para conveniência nos services
    public String getOwnerId() {
        return owner != null ? owner.getId() : null;
    }

    public String getThemeId() {
        return themeId;
    }

    public void setThemeId(String themeId) {
        this.themeId = themeId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getSealedAt() {
        return sealedAt;
    }

    public void setSealedAt(LocalDateTime sealedAt) {
        this.sealedAt = sealedAt;
    }

    public LocalDateTime getUnlockDate() {
        return unlockDate;
    }

    public void setUnlockDate(LocalDateTime unlockDate) {
        this.unlockDate = unlockDate;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public boolean isGift() {
        return isGift;
    }

    public void setGift(boolean gift) {
        isGift = gift;
    }

    public String getOwnerMessage() {
        return ownerMessage;
    }

    public void setOwnerMessage(String ownerMessage) {
        this.ownerMessage = ownerMessage;
    }

    public CapsuleStatus getStatus() {
        return status;
    }

    public void setStatus(CapsuleStatus status) {
        this.status = status;
    }

    public boolean isTestMode() {
        return isTestMode;
    }

    public void setTestMode(boolean testMode) {
        isTestMode = testMode;
    }

    public StorageStatus getStorageStatus() {
        return storageStatus;
    }

    public void setStorageStatus(StorageStatus storageStatus) {
        this.storageStatus = storageStatus;
    }

    public java.util.UUID getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(java.util.UUID accessToken) {
        this.accessToken = accessToken;
    }

    public CapsulePlan getPlanType() {
        return planType;
    }

    public void setPlanType(CapsulePlan planType) {
        this.planType = planType;
    }

    public long getTotalSizeBytes() {
        return totalSizeBytes;
    }

    public void setTotalSizeBytes(long totalSizeBytes) {
        this.totalSizeBytes = totalSizeBytes;
    }

    public List<MemoryItem> getItems() {
        return items;
    }

    public void setItems(List<MemoryItem> items) {
        this.items = items;
    }

    public List<CapsuleGuardian> getGuardians() {
        return guardians;
    }

    public void setGuardians(List<CapsuleGuardian> guardians) {
        this.guardians = guardians;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
