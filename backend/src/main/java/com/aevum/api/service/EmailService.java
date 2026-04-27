package com.aevum.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.aevum.api.domain.Capsule;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendAwakeningEmail(Capsule capsule) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(capsule.getRecipientEmail());
            message.setSubject("O tempo despertou: Uma relíquia espera por você");
            
            String text = "Saudações do passado.\n\n"
                    + "Você foi definido como o herdeiro de uma Cápsula do Tempo chamada '" + capsule.getTitle() + "'.\n"
                    + "O forjador enviou isso para você através dos anos.\n\n"
                    + "O selo temporal foi quebrado e as memórias já estão disponíveis.\n\n"
                    + "Acesse sua cápsula em: http://localhost:3000/vault/" + capsule.getId() + "\n\n"
                    + "O Aevum agradece.";
            
            message.setText(text);
            message.setFrom("mensageiro@aevum.com");
            
            mailSender.send(message);
            log.info("E-mail de despertar enviado para {}", capsule.getRecipientEmail());
        } catch (Exception e) {
            log.error("Erro ao enviar e-mail para {}", capsule.getRecipientEmail(), e);
        }
    }
}
