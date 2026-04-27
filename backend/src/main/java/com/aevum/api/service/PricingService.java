package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsulePlan;
import com.aevum.api.domain.TimeTier;
import org.springframework.stereotype.Service;

@Service
public class PricingService {

    // Preços listados em CENTAVOS (R$ 10,00 = 1000 centavos)
    // Tabela de preços calculada para cobrir CAC (Custo de Aquisição) e Custos AWS de longo prazo
    public long calculatePriceInCents(CapsulePlan plan, TimeTier timeTier) {
        long basePrice = 0L;

        // Base no tamanho (Garante margem de lucro para marketing e Stripe)
        switch (plan) {
            case ESQUIRE_1GB -> basePrice = 1990L;  // R$ 19,90
            case KNIGHT_5GB -> basePrice = 4990L;   // R$ 49,90
            case BARON_10GB -> basePrice = 7990L;   // R$ 79,90
            case MARQUIS_25GB -> basePrice = 14990L; // R$ 149,90
            case KING_50GB -> basePrice = 24990L;   // R$ 249,90
        }

        // Multiplicador por tempo. Não multiplicamos o valor inteiro 4x como antes,
        // pois o capital investido hoje rende juros para pagar a AWS do futuro.
        // Adicionamos apenas uma taxa simbólica para aumentar o caixa inicial.
        double timeMultiplier = 1.0;
        switch (timeTier) {
            case SHORT_TERM -> timeMultiplier = 1.0;  // Sem custo extra até 5 anos
            case GENERATION -> timeMultiplier = 1.15; // +15% até 25 anos
            case LEGACY -> timeMultiplier = 1.30;     // +30% acima de 25 anos
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

    // Calcula a multa para quebrar o selo antes do tempo
    public long calculateEarlyUnlockPenaltyInCents(Capsule capsule) {
        TimeTier timeTier = TimeTier.determineTier(capsule.getUnlockDate());
        long originalPrice = calculatePriceInCents(capsule.getPlanType(), timeTier);
        
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
