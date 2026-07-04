package com.aevum.api.service;

import com.aevum.api.domain.CapsulePlan;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class PricingServiceTest {

    private final PricingService pricingService = new PricingService();

    @Test
    public void testExpressPricing() {
        LocalDateTime unlockDate = LocalDateTime.now().plusDays(15);
        // Epoch 1GB Express (R$ 4,90)
        assertEquals(490L, pricingService.calculatePriceInCents(CapsulePlan.EPOCH_1GB, unlockDate));
        // Aevum 5GB Express (R$ 9,90)
        assertEquals(990L, pricingService.calculatePriceInCents(CapsulePlan.AEVUM_5GB, unlockDate));
    }

    @Test
    public void testTemporadaPricing() {
        LocalDateTime unlockDate = LocalDateTime.now().plusDays(100);
        // Epoch 1GB Temporada (R$ 9,90)
        assertEquals(990L, pricingService.calculatePriceInCents(CapsulePlan.EPOCH_1GB, unlockDate));
        // Aevum 5GB Temporada (R$ 19,90)
        assertEquals(1990L, pricingService.calculatePriceInCents(CapsulePlan.AEVUM_5GB, unlockDate));
    }

    @Test
    public void testLegacy5YearsPricing() {
        LocalDateTime unlockDate = LocalDateTime.now().plusDays((long) (5 * 365.25));
        // Epoch 1GB Legado (1-10 anos: R$ 19,90)
        assertEquals(1990L, pricingService.calculatePriceInCents(CapsulePlan.EPOCH_1GB, unlockDate));
        // Aevum 5GB Legado (1-10 anos: R$ 34,90)
        assertEquals(3490L, pricingService.calculatePriceInCents(CapsulePlan.AEVUM_5GB, unlockDate));
    }

    @Test
    public void testLegacy25YearsPricing() {
        LocalDateTime unlockDate = LocalDateTime.now().plusDays((long) (25 * 365.25));
        // Epoch 1GB Legado (11-30 anos: R$ 39,90)
        assertEquals(3990L, pricingService.calculatePriceInCents(CapsulePlan.EPOCH_1GB, unlockDate));
        // Aevum 5GB Legado (11-30 anos: R$ 69,90)
        assertEquals(6990L, pricingService.calculatePriceInCents(CapsulePlan.AEVUM_5GB, unlockDate));
    }

    @Test
    public void testLegacy50YearsPricing() {
        LocalDateTime unlockDate = LocalDateTime.now().plusDays((long) (50 * 365.25));
        // Epoch 1GB Legado (Acima de 30 anos: R$ 79,90)
        assertEquals(7990L, pricingService.calculatePriceInCents(CapsulePlan.EPOCH_1GB, unlockDate));
        // Aevum 5GB Legado (Acima de 30 anos: R$ 129,90)
        assertEquals(12990L, pricingService.calculatePriceInCents(CapsulePlan.AEVUM_5GB, unlockDate));
    }
}
