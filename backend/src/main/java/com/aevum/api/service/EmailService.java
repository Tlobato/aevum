package com.aevum.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.aevum.api.domain.Capsule;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    @Value("${aevum.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @org.springframework.scheduling.annotation.Async
    public void sendSealingConfirmation(String ownerEmail, String ownerName, String capsuleTitle, java.time.LocalDate unlockDate) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(ownerEmail);
            message.setSubject("Selo da Eternidade Ativado: " + capsuleTitle);

            String text = "Saudações, Forjador do Tempo.\n\n"
                    + "Seu pagamento foi confirmado e a cápsula '" + capsuleTitle + "' foi selada com sucesso.\n"
                    + "Seus arquivos foram movidos para o Gelo Eterno e estarão seguros até o dia "
                    + unlockDate + ".\n\n"
                    + "Você pode acompanhar o status da sua relíquia em seu Dashboard.\n\n"
                    + "Obrigado por confiar ao Aevum seu legado.";

            message.setText(text);
            message.setFrom("mensageiro@myaevum.space");
            mailSender.send(message);
            log.info("E-mail de confirmação de selagem enviado para {}", ownerEmail);
        } catch (Exception e) {
            log.error("Erro ao enviar confirmação para {}", ownerEmail, e);
        }
    }

    @org.springframework.scheduling.annotation.Async
    public void sendGiftNotification(String recipientEmail, String capsuleTitle, java.time.LocalDate unlockDate) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipientEmail);
            message.setSubject("Alguém do passado preparou algo para você...");

            String text = "Olá,\n\n"
                    + "Estamos escrevendo para avisar que uma cápsula do tempo foi forjada e destinada a você.\n"
                    + "Ela foi selada e só poderá ser aberta no futuro, em " + unlockDate + ".\n\n"
                    + "Não se preocupe, no dia do despertar nós lhe enviaremos um novo e-mail com a chave de acesso.\n\n"
                    + "O tempo guarda grandes histórias.";

            message.setText(text);
            message.setFrom("mensageiro@myaevum.space");
            mailSender.send(message);
            log.info("Aviso de presente enviado para {}", recipientEmail);
        } catch (Exception e) {
            log.error("Erro ao enviar aviso de presente para {}", recipientEmail, e);
        }
    }

    @org.springframework.scheduling.annotation.Async
    public void sendAwakeningEmail(String recipientEmail, String capsuleTitle, String ownerMessage, java.util.UUID capsuleId, java.util.UUID accessToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipientEmail);
            message.setSubject("O tempo despertou: Uma relíquia espera por você");

            // Link com Token para acesso público
            String publicLink = frontendUrl + "/vault/" + capsuleId + "?token=" + accessToken;

            String text = "Saudações.\n\n"
                    + "Você foi definido como o herdeiro da Cápsula do Tempo '" + capsuleTitle + "'.\n"
                    + "O forjador enviou isso para você através dos anos.\n\n"
                    + (ownerMessage != null ? "Houve também uma mensagem especial deixada para você:\n\n\"" + ownerMessage + "\"\n\n" : "")
                    + "O selo temporal foi quebrado e o legado já está disponível.\n\n"
                    + "Acesse sua relíquia em: " + publicLink + "\n\n"
                    + "O Aevum agradece.";

            message.setText(text);
            message.setFrom("mensageiro@myaevum.space");

            mailSender.send(message);
            log.info("E-mail de despertar enviado para {}", recipientEmail);
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail de despertar para {}", recipientEmail, e);
        }
    }
}
