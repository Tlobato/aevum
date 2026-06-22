package com.aevum.api.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 255)
    private String id;

    @Column(nullable = true, unique = false, length = 150)
    private String email;

    @Column(nullable = false, length = 50)
    private String planType = "PAY_PER_USE";

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Capsule> capsules = new ArrayList<>();

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }

    public List<Capsule> getCapsules() { return capsules; }
    public void setCapsules(List<Capsule> capsules) { this.capsules = capsules; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
