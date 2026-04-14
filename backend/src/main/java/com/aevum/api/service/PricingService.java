package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsulePlan;
import com.aevum.api.domain.TimeTier;
import org.springframework.stereotype.Service;

@Service
public class PricingService {

    // Preços listados em CENTAVOS (R$ 10,00 = 1000 centavos)
    // Uma matriz simples baseada na combinação de Espaço e Tempo
    public long calculatePriceInCents(CapsulePlan plan, TimeTier timeTier) {
        long basePrice = 0L;

        // Base no tamanho (custo fixo de processamento/upload)
        switch (plan) {
            case ESQUIRE_1GB -> basePrice = 500L; // R$ 5,00 base
            case KNIGHT_5GB -> basePrice = 1500L;
            case BARON_10GB -> basePrice = 2500L;
            case MARQUIS_25GB -> basePrice = 5000L;
            case KING_50GB -> basePrice = 8500L;
        }

        // Multiplicador por tempo de bloqueio (custa guardar arquivos na AWS)
        double timeMultiplier = 1.0;
        switch (timeTier) {
            case SHORT_TERM -> timeMultiplier = 1.0; // Até 5a
            case GENERATION -> timeMultiplier = 2.5; // Até 25a
            case LEGACY -> timeMultiplier = 4.0;     // Acima de 25a
        }

        return (long) (basePrice * timeMultiplier);
    }

    public PricingSummary calculateSealSummary(Capsule capsule) {
        TimeTier timeTier = TimeTier.determineTier(capsule.getUnlockDate());
        long priceCents = calculatePriceInCents(capsule.getPlanType(), timeTier);

        return new PricingSummary(
            capsule.getPlanType().name(),
            capsule.getPlanType().getMaxSizeBytes(),
            capsule.getTotalSizeBytes(),
            timeTier.name(),
            capsule.getUnlockDate(),
            priceCents
        );
    }

    public record PricingSummary(
        String planType,
        long maxSizeBytes,
        long usedSizeBytes,
        String timeTier,
        java.time.LocalDateTime unlockDate,
        long priceInCents
    ) {}
}
