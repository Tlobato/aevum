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
        long days = java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDateTime.now(), unlockDate);
        if (days < 1) {
            days = 1;
        }

        // Mapeia os planos legados ou ativos nas duas faixas de preço estabelecidas:
        // Menores ou iguais a 3GB (Epoch/Chronos/Aeon) são enquadrados como 1 GB.
        // Maiores (Eternity/Aevum) são enquadrados como 5 GB.
        boolean isSmallPlan = plan == CapsulePlan.EPOCH_1GB || plan == CapsulePlan.CHRONOS_2GB || plan == CapsulePlan.AEON_3GB;

        if (days < 30) {
            // Express (1 a 29 dias)
            return isSmallPlan ? 490L : 990L; // R$ 4,90 ou R$ 9,90
        } else if (days <= 365) {
            // Temporada (30 a 365 dias)
            return isSmallPlan ? 990L : 1990L; // R$ 9,90 ou R$ 19,90
        } else {
            // Legado (Mais de 1 ano)
            return isSmallPlan ? 1990L : 3490L; // R$ 19,90 ou R$ 34,90
        }
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
        
        // Taxa proporcional: 30% do valor pago originalmente, com piso de R$ 9,90 (990 centavos)
        long penalty = (long) (originalPrice * 0.3);
        if (penalty < 990L) {
            penalty = 990L;
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
