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

        // Calcula a duração em dias (mínimo de 2 dias)
        long days = java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDateTime.now(), unlockDate);
        if (days < 2) {
            days = 2;
        }

        // Aplica desconto na taxa base para prazos curtos
        double baseMultiplier = 1.0;
        if (days < 30) {
            baseMultiplier = 0.65; // 35% de desconto para prazos menores que 30 dias
        } else if (days < 180) {
            baseMultiplier = 0.80; // 20% de desconto para prazos menores que 180 dias
        }
        long finalBasePrice = (long) (basePrice * baseMultiplier);

        // Taxa de armazenamento anual: R$ 0,20 por GB ao ano.
        // Sob a regra do AWS Glacier Deep Archive, o faturamento mínimo de armazenamento é de 180 dias.
        double billingYears = days / 365.25;
        if (days < 180) {
            billingYears = 180.0 / 365.25; // Garante o repasse do mínimo de 180 dias cobrados pela AWS
        }

        long sizeInGB = plan.getMaxSizeBytes() / (1024L * 1024 * 1024);
        long annualStorageFee = (long) (sizeInGB * billingYears * 20L); // 20 centavos por GB ao ano em centavos

        return finalBasePrice + annualStorageFee;
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
