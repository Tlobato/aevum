package com.aevum.api.service;

import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Gerador de templates HTML para e-mails do Aevum com suporte a i18n.
 * Carrega textos dinamicamente do ResourceBundle e formata datas conforme a localidade do usuário.
 */
@Component
public class EmailTemplateGenerator {

    private final MessageSource messageSource;

    public EmailTemplateGenerator(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public String generateBaseTemplate(String title, String contentHTML, String buttonUrl, String buttonText, Locale locale) {
        String buttonHTML = "";
        if (buttonUrl != null && !buttonUrl.isEmpty() && buttonText != null && !buttonText.isEmpty()) {
            buttonHTML = "    <div class='button-container'><a href='" + buttonUrl + "' class='button'>" + buttonText + "</a></div>";
        }

        String footerText = messageSource.getMessage("email.footer", null, locale);

        return "<!DOCTYPE html>"
             + "<html>"
             + "<head>"
             + "<meta charset='UTF-8'>"
             + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
             + "<style>"
             + "  body { background-color: #0a0a0a; color: #e5e5e5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 40px 20px; }"
             + "  .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #333; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }"
             + "  .logo { color: #f59e0b; font-size: 24px; font-weight: bold; letter-spacing: 6px; margin-bottom: 30px; text-transform: uppercase; }"
             + "  .title { font-size: 24px; color: #fff; margin-bottom: 24px; font-weight: 300; letter-spacing: 1px; }"
             + "  .content { line-height: 1.8; color: #a3a3a3; font-size: 16px; margin-bottom: 30px; text-align: left; }"
             + "  .highlight { color: #f59e0b; font-weight: bold; }"
             + "  .button-container { margin: 30px 0; }"
             + "  .button { display: inline-block; padding: 16px 32px; background: linear-gradient(to right, #f59e0b, #d97706); color: #000 !important; text-decoration: none; border-radius: 6px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }"
             + "  .footer { margin-top: 50px; padding-top: 30px; border-top: 1px solid #262626; font-size: 11px; color: #525252; letter-spacing: 2px; }"
             + "</style>"
             + "</head>"
             + "<body>"
             + "  <div class='container'>"
             + "    <div class='logo'>AEVUM</div>"
             + "    <div class='title'>" + title + "</div>"
             + "    <div class='content'>" + contentHTML + "</div>"
             + buttonHTML
             + "    <div class='footer'>" + footerText + "</div>"
             + "  </div>"
             + "</body>"
             + "</html>";
    }

    public String sealingConfirmation(String capsuleTitle, LocalDate unlockDate, boolean isGift, String recipientEmail, String link, Locale locale) {
        String datePattern = messageSource.getMessage("date.format", null, locale);
        String formattedDate = unlockDate.format(DateTimeFormatter.ofPattern(datePattern));

        String title = messageSource.getMessage("email.sealing.title", null, locale);
        String content;
        String buttonText;

        if (isGift) {
            content = messageSource.getMessage("email.sealing.body.gift", new Object[]{capsuleTitle, recipientEmail, formattedDate}, locale);
            buttonText = messageSource.getMessage("email.sealing.button.gift", null, locale);
        } else {
            content = messageSource.getMessage("email.sealing.body.personal", new Object[]{capsuleTitle, formattedDate}, locale);
            buttonText = messageSource.getMessage("email.sealing.button.personal", null, locale);
        }
        
        return generateBaseTemplate(title, content, link, buttonText, locale);
    }

    public String giftNotification(String capsuleTitle, LocalDate unlockDate, String link, Locale locale) {
        String datePattern = messageSource.getMessage("date.format", null, locale);
        String formattedDate = unlockDate.format(DateTimeFormatter.ofPattern(datePattern));

        String title = messageSource.getMessage("email.gift.title", null, locale);
        String content = messageSource.getMessage("email.gift.body", new Object[]{formattedDate}, locale);
        String buttonText = messageSource.getMessage("email.gift.button", null, locale);

        return generateBaseTemplate(title, content, link, buttonText, locale);
    }

    public String awakeningEmail(String capsuleTitle, String ownerMessage, String publicLink, Locale locale) {
        String title = messageSource.getMessage("email.awakening.title", null, locale);
        
        String ownerMsgSection = "";
        if (ownerMessage != null && !ownerMessage.isBlank()) {
            ownerMsgSection = messageSource.getMessage("email.awakening.owner_message", new Object[]{ownerMessage}, locale);
        }

        String content = messageSource.getMessage("email.awakening.body", new Object[]{capsuleTitle, ownerMsgSection}, locale);
        String buttonText = messageSource.getMessage("email.awakening.button", null, locale);

        return generateBaseTemplate(title, content, publicLink, buttonText, locale);
    }
}
