package com.aevum.api.domain;

public enum CapsulePlan {
    EPOCH_1GB(1L * 1024 * 1024 * 1024),
    CHRONOS_2GB(2L * 1024 * 1024 * 1024),
    AEON_3GB(3L * 1024 * 1024 * 1024),
    ETERNITY_4GB(4L * 1024 * 1024 * 1024),
    AEVUM_5GB(5L * 1024 * 1024 * 1024);

    private final long maxSizeBytes;

    CapsulePlan(long maxSizeBytes) {
        this.maxSizeBytes = maxSizeBytes;
    }

    public long getMaxSizeBytes() {
        return maxSizeBytes;
    }
}
