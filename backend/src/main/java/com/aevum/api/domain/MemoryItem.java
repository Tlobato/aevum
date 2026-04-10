package com.aevum.api.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "memory_items")
public class MemoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "capsule_id", nullable = false)
    private Capsule capsule;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType type;

    // Pode ser um texto longo (se for uma Carta) ou a URI do AWS S3 se for mídia
    @Column(columnDefinition = "TEXT", nullable = false)
    private String contentPayload;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Capsule getCapsule() { return capsule; }
    public void setCapsule(Capsule capsule) { this.capsule = capsule; }
    public ItemType getType() { return type; }
    public void setType(ItemType type) { this.type = type; }
    public String getContentPayload() { return contentPayload; }
    public void setContentPayload(String contentPayload) { this.contentPayload = contentPayload; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
