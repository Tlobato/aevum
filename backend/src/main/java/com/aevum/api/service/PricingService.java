package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsulePlan;
import com.aevum.api.domain.TimeTier;
import org.springframework.stereotype.Service;

@Service
public class PricingService {

    // Preços listados em CENTAVOS (R$ 10,00 = 1000 centavos)
    // Tabela de preços calculada para cobrir CAC (Custo de Aquisição) e Custos AWS de longo prazo
    public long calculatePriceInCents(CapsulePlan plan, java.time.LocalDateTime unlockDate) {
        long basePrice = 0L;

        // Base no tamanho (Garante margem de lucro para marketing e Stripe)
        switch (plan) {
            case EPOCH_1GB -> basePrice = 1990L;  // R$ 19,90
            case CHRONOS_2GB -> basePrice = 2990L; // R$ 29,90
            case AEON_3GB -> basePrice = 3990L;   // R$ 39,90
            case ETERNITY_4GB -> basePrice = 4990L; // R$ 49,90
            case AEVUM_5GB -> basePrice = 5990L;   // R$ 59,90
        }

        // Calcula a duração exata em anos (mínimo de 1 ano para maturação)
        long years = java.time.temporal.ChronoUnit.YEARS.between(java.time.LocalDateTime.now(), unlockDate);
        if (years < 1) {
            years = 1;
        }

        // Taxa de armazenamento anual: R$ 0,20 por GB ao ano
        long sizeInGB = plan.getMaxSizeBytes() / (1024L * 1024 * 1024);
        long annualStorageFee = sizeInGB * years * 20L; // 20 centavos por GB ao ano em centavos

        return basePrice + annualStorageFee;
    }

    public PricingSummary calculateSealSummary(Capsule capsule) {
        TimeTier timeTier = TimeTier.determineTier(capsule.getUnlockDate());
        long priceCents = calculatePriceInCents(capsule.getPlanType(), capsule.getUnlockDate());

        return new PricingSummary(
            capsule.getPlanType().name(),
            capsule.getPlanType().getMaxSizeBytes(),
            capsule.getTotalSizeBytes(),
            timeTier.name(),
            capsule.getUnlockDate(),
            priceCents
        );
    }

    // Calcula a multa para quebrar o selo antes do tempo
    public long calculateEarlyUnlockPenaltyInCents(Capsule capsule) {
        long originalPrice = calculatePriceInCents(capsule.getPlanType(), capsule.getUnlockDate());
        
        // Multa de 50% do valor pago originalmente, com valor mínimo de R$ 29,90
        long penalty = (long) (originalPrice * 0.5);
        if (penalty < 2990L) {
            penalty = 2990L;
        }
        return penalty;
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
