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

    // ID do usuário autenticado no sistema (ex: Clerk / Auth0)
    @Column(nullable = false)
    private String ownerId;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CapsuleStatus status = CapsuleStatus.DRAFT;

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

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
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
