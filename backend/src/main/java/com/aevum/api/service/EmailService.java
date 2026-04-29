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

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${RESEND_API_KEY:}")
    private String resendApiKey;

    @Value("${aevum.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private void sendViaApi(String to, String subject, String text) {
        if (resendApiKey == null || resendApiKey.isEmpty()) {
            log.warn("RESEND_API_KEY não configurada. E-mail para {} não será enviado.", to);
            return;
        }

        try {
            String url = "https://api.resend.com/emails";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> body = Map.of(
                "from", "Aevum <mensageiro@myaevum.space>",
                "to", List.of(to),
                "subject", subject,
                "text", text
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, entity, String.class);
            
            log.info("E-mail via API enviado com sucesso para {}", to);
        } catch (Exception e) {
            log.error("Falha crítica ao enviar e-mail via API para {}: {}", to, e.getMessage());
        }
    }

    @org.springframework.scheduling.annotation.Async
    public void sendSealingConfirmation(String ownerEmail, String ownerName, String capsuleTitle, java.time.LocalDate unlockDate) {
        String subject = "Selo da Eternidade Ativado: " + capsuleTitle;
        String text = "Saudações, Forjador do Tempo.\n\n"
                + "Seu pagamento foi confirmado e a cápsula '" + capsuleTitle + "' foi selada com sucesso.\n"
                + "Seus arquivos foram movidos para o Gelo Eterno e estarão seguros até o dia "
                + unlockDate + ".\n\n"
                + "Você pode acompanhar o status da sua relíquia em seu Dashboard.\n\n"
                + "Obrigado por confiar ao Aevum seu legado.";
        
        sendViaApi(ownerEmail, subject, text);
    }

    @org.springframework.scheduling.annotation.Async
    public void sendGiftNotification(String recipientEmail, String capsuleTitle, java.time.LocalDate unlockDate) {
        String subject = "Alguém do passado preparou algo para você...";
        String text = "Olá,\n\n"
                + "Estamos escrevendo para avisar que uma cápsula do tempo foi forjada e destinada a você.\n"
                + "Ela foi selada e só poderá ser aberta no futuro, em " + unlockDate + ".\n\n"
                + "Não se preocupe, no dia do despertar nós lhe enviaremos um novo e-mail com a chave de acesso.\n\n"
                + "O tempo guarda grandes histórias.";

        sendViaApi(recipientEmail, subject, text);
    }

    @org.springframework.scheduling.annotation.Async
    public void sendAwakeningEmail(String recipientEmail, String capsuleTitle, String ownerMessage, java.util.UUID capsuleId, java.util.UUID accessToken) {
        String subject = "O tempo despertou: Uma relíquia espera por você";
        String publicLink = frontendUrl + "/vault/" + capsuleId + "?token=" + accessToken;

        String text = "Saudações.\n\n"
                + "Você foi definido como o herdeiro da Cápsula do Tempo '" + capsuleTitle + "'.\n"
                + "O forjador enviou isso para você através dos anos.\n\n"
                + (ownerMessage != null ? "Houve também uma mensagem especial deixada para você:\n\n\"" + ownerMessage + "\"\n\n" : "")
                + "O selo temporal foi quebrado e o legado já está disponível.\n\n"
                + "Acesse sua relíquia em: " + publicLink + "\n\n"
                + "O Aevum agradece.";

        sendViaApi(recipientEmail, subject, text);
    }
}
