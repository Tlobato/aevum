package com.aevum.api.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    private static final Logger log = LoggerFactory.getLogger(StripeService.class);

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${aevum.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Cria uma Sessão de Checkout no Stripe.
     * O cliente é redirecionado para a página segura do Stripe para pagar.
     * Após o pagamento, o Stripe redireciona de volta para nossa URL de sucesso.
     *
     * @param capsuleId UUID da cápsula que está sendo selada
     * @param priceInCents Valor em centavos (ex: R$ 49,90 = 4990)
     * @param capsuleTitle Título da cápsula (aparece na fatura do Stripe)
     * @return URL da página de pagamento do Stripe
     */
    public String createCheckoutSession(String capsuleId, long priceInCents, String capsuleTitle) throws StripeException {
        Stripe.apiKey = secretKey;

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(frontendUrl + "/payment/success?capsule_id=" + capsuleId + "&session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/dashboard?payment=cancelled")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("brl")
                                                .setUnitAmount(priceInCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Aevum — " + capsuleTitle)
                                                                .setDescription("Lacre temporal permanente. Uma vez selado, o tempo começa a correr.")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                // Metadados para identificarmos a cápsula quando o webhook chegar
                .putMetadata("capsule_id", capsuleId)
                .build();

        Session session = Session.create(params);
        log.info("Checkout Session criada para cápsula {}: {}", capsuleId, session.getId());
        return session.getUrl();
    }
}
