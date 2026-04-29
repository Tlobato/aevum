package com.aevum.api.service;

import org.springframework.stereotype.Component;

/**
 * Gerador de templates HTML para e-mails do Aevum.
 * Centraliza toda a parte visual e tipografia para manter a consistência da marca.
 */
@Component
public class EmailTemplateGenerator {

    public String generateBaseTemplate(String title, String contentHTML) {
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
             + "    <div class='footer'>O TEMPO GUARDA GRANDES HISTÓRIAS.</div>"
             + "  </div>"
             + "</body>"
             + "</html>";
    }

    public String sealingConfirmation(String capsuleTitle, String unlockDate, boolean isGift, String recipientEmail) {
        String content;
        if (isGift) {
            content = "Saudações, Forjador do Tempo.<br><br>"
                    + "Seu pagamento foi confirmado e o presente <span class='highlight'>'" + capsuleTitle + "'</span> foi selado com sucesso.<br><br>"
                    + "Nós cuidaremos para que este legado seja entregue a <span class='highlight'>" + recipientEmail + "</span> no dia <span class='highlight'>"
                    + unlockDate + "</span>.<br><br>"
                    + "Obrigado por confiar ao Aevum a entrega dessa memória.";
        } else {
            content = "Saudações, Forjador do Tempo.<br><br>"
                    + "Seu pagamento foi confirmado e o selo da sua cápsula pessoal <span class='highlight'>'" + capsuleTitle + "'</span> foi ativado com sucesso.<br><br>"
                    + "Seu legado agora reside no <span class='highlight'>Gelo Eterno</span>, protegido contra o desgaste dos anos até o dia <span class='highlight'>"
                    + unlockDate + "</span>.<br><br>"
                    + "Você pode monitorar a integridade da sua relíquia através do seu painel de controle.";
        }
        
        return generateBaseTemplate("Relíquia Selada", content);
    }

    public String giftNotification(String capsuleTitle, String unlockDate) {
        String content = "Olá,<br><br>"
                + "Uma voz do passado ecoou para você. Uma cápsula do tempo foi forjada e destinada ao seu nome.<br><br>"
                + "Ela foi selada sob as leis da eternidade e só poderá ser revelada em <span class='highlight'>" + unlockDate + "</span>.<br><br>"
                + "No dia do despertar, enviaremos as chaves necessárias para que o selo seja quebrado.<br><br>"
                + "Até lá, o mistério permanece guardado.";

        return generateBaseTemplate("Um Presente Temporal", content);
    }

    public String awakeningEmail(String capsuleTitle, String ownerMessage, String publicLink) {
        String content = "O tempo determinado chegou.<br><br>"
                + "O selo da Cápsula <span class='highlight'>'" + capsuleTitle + "'</span> foi quebrado. O que foi guardado através dos anos agora está pronto para ser visto por você.<br><br>"
                + (ownerMessage != null ? "O forjador deixou esta mensagem para este momento:<br><br><i>\"" + ownerMessage + "\"</i><br><br>" : "")
                + "Acesse sua herança digital agora através do portal seguro abaixo:";

        String finalHtml = generateBaseTemplate("O Despertar", content);
        
        // Adicionando o botão de ação manualmente antes do footer
        return finalHtml.replace("</div>    <div class='footer'>", 
            "  <div class='button-container'><a href='" + publicLink + "' class='button'>Quebrar o Selo</a></div></div>    <div class='footer'>");
    }
}
