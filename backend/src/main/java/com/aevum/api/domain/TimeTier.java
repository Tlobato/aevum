package com.aevum.api.domain;

import java.time.temporal.ChronoUnit;
import java.time.LocalDateTime;

public enum TimeTier {
    SHORT_TERM(5),      // Até 5 anos
    GENERATION(25),     // Até 25 anos
    LEGACY(100);        // Acima de 25 anos (Até 100 anos)

    private final int maxYears;

    TimeTier(int maxYears) {
        this.maxYears = maxYears;
    }

    public int getMaxYears() {
        return maxYears;
    }

    public static TimeTier determineTier(LocalDateTime unlockDate) {
        long years = ChronoUnit.YEARS.between(LocalDateTime.now(), unlockDate);
        if (years <= 5) return SHORT_TERM;
        if (years <= 25) return GENERATION;
        return LEGACY;
    }
}
