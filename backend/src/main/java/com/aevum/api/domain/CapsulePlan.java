package com.aevum.api.domain;

public enum CapsulePlan {
    ESQUIRE_1GB(1L * 1024 * 1024 * 1024),
    KNIGHT_5GB(5L * 1024 * 1024 * 1024),
    BARON_10GB(10L * 1024 * 1024 * 1024),
    MARQUIS_25GB(25L * 1024 * 1024 * 1024),
    KING_50GB(50L * 1024 * 1024 * 1024);

    private final long maxSizeBytes;

    CapsulePlan(long maxSizeBytes) {
        this.maxSizeBytes = maxSizeBytes;
    }

    public long getMaxSizeBytes() {
        return maxSizeBytes;
    }
}
