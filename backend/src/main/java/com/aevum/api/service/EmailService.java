package com.aevum.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.Map;
import java.util.List;

/**
 * Serviço responsável pelo envio técnico de e-mails via API REST do Resend.
 * Utiliza o EmailTemplateGenerator para obter o conteúdo visual (HTML).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final EmailTemplateGenerator templateGenerator;
    private final org.springframework.context.MessageSource messageSource;

    @Value("${MAIL_PASSWORD:}")
    private String resendApiKey;

    @Value("${aevum.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(EmailTemplateGenerator templateGenerator, org.springframework.context.MessageSource messageSource) {
        this.templateGenerator = templateGenerator;
        this.messageSource = messageSource;
    }

    private void sendViaApi(String to, String subject, String htmlContent) {
        if (resendApiKey == null || resendApiKey.isEmpty()) {
            log.warn("RESEND_API_KEY não configurada. E-mail para {} não será enviado.", to);
            return;
        }

        if (to == null || to.isEmpty() || to.equalsIgnoreCase("unknown") || !to.contains("@")) {
            log.warn("Endereço de e-mail inválido: {}. Abortando envio via API.", to);
            return;
        }

        try {
            String url = "https://api.resend.com/emails";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = Map.of(
                "from", "Aevum <mensageiro@myaevum.space>",
                "to", to,
                "subject", subject,
                "html", htmlContent
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, entity, String.class);
            
            log.info("E-mail HTML via API enviado com sucesso para {}", to);
        } catch (Exception e) {
            log.error("Falha crítica ao enviar e-mail HTML via API para {}: {}", to, e.getMessage());
        }
    }

    @org.springframework.scheduling.annotation.Async
    public void sendSealingConfirmation(String ownerEmail, String ownerName, String capsuleTitle, java.time.LocalDate unlockDate, boolean isGift, String recipientEmail, java.util.UUID capsuleId, String localeTag) {
        java.util.Locale locale = (localeTag == null || localeTag.isBlank()) ? java.util.Locale.forLanguageTag("pt-BR") : java.util.Locale.forLanguageTag(localeTag);
        String subject = messageSource.getMessage("email.sealing.subject", new Object[]{capsuleTitle}, locale);
        String link = frontendUrl + "/vault/" + capsuleId;
        String html = templateGenerator.sealingConfirmation(capsuleTitle, unlockDate, isGift, recipientEmail, link, locale);
        sendViaApi(ownerEmail, subject, html);
    }

    @org.springframework.scheduling.annotation.Async
    public void sendGiftNotification(String recipientEmail, String capsuleTitle, java.time.LocalDate unlockDate, java.util.UUID capsuleId, String localeTag) {
        java.util.Locale locale = (localeTag == null || localeTag.isBlank()) ? java.util.Locale.forLanguageTag("pt-BR") : java.util.Locale.forLanguageTag(localeTag);
        String subject = messageSource.getMessage("email.gift.subject", null, locale);
        String link = frontendUrl + "/vault/" + capsuleId;
        String html = templateGenerator.giftNotification(capsuleTitle, unlockDate, link, locale);
        sendViaApi(recipientEmail, subject, html);
    }

    @org.springframework.scheduling.annotation.Async
    public void sendAwakeningEmail(String recipientEmail, String capsuleTitle, String ownerMessage, java.util.UUID capsuleId, java.util.UUID accessToken, String localeTag) {
        java.util.Locale locale = (localeTag == null || localeTag.isBlank()) ? java.util.Locale.forLanguageTag("pt-BR") : java.util.Locale.forLanguageTag(localeTag);
        String subject = messageSource.getMessage("email.awakening.subject", null, locale);
        String publicLink = frontendUrl + "/vault/" + capsuleId + "?token=" + accessToken;
        String html = templateGenerator.awakeningEmail(capsuleTitle, ownerMessage, publicLink, locale);
        sendViaApi(recipientEmail, subject, html);
    }

    @org.springframework.scheduling.annotation.Async
    public void sendWelcomeEmail(String toEmail, String localeTag) {
        java.util.Locale locale = (localeTag == null || localeTag.isBlank()) ? java.util.Locale.forLanguageTag("pt-BR") : java.util.Locale.forLanguageTag(localeTag);
        String subject = messageSource.getMessage("email.welcome.subject", null, locale);
        String link = frontendUrl + "/dashboard";
        String html = templateGenerator.welcomeEmail(link, locale);
        sendViaApi(toEmail, subject, html);
    }

    @org.springframework.scheduling.annotation.Async
    public void sendSecurityAlertEmail(String ownerEmail, String capsuleTitle, String oldEmail, String newEmail, String localeTag) {
        java.util.Locale locale = (localeTag == null || localeTag.isBlank()) ? java.util.Locale.forLanguageTag("pt-BR") : java.util.Locale.forLanguageTag(localeTag);
        String subject = messageSource.getMessage("email.security_alert.subject", null, locale);
        String link = frontendUrl + "/dashboard";
        String html = templateGenerator.securityAlertEmail(capsuleTitle, oldEmail, newEmail, link, locale);
        sendViaApi(ownerEmail, subject, html);
    }
}
