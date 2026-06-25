package com.aevum.api.controller;

import com.aevum.api.domain.User;
import com.aevum.api.repository.UserRepository;
import com.aevum.api.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ClerkWebhookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    private static final String TEST_SECRET = "whsec_cGFzc3dvcmQxMjM0NTY3ODkwMTIzNDU2Nzg5MA==";

    @BeforeEach
    void setUp() {
        ClerkWebhookController controller = new ClerkWebhookController(TEST_SECRET, userRepository, emailService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private String generateSvixSignature(String svixId, String svixTimestamp, String payload) throws Exception {
        String cleanedSecret = TEST_SECRET.replaceFirst("^whsec_", "");
        byte[] keyBytes = Base64.getDecoder().decode(cleanedSecret);
        SecretKeySpec signingKey = new SecretKeySpec(keyBytes, "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(signingKey);
        String toSign = svixId + "." + svixTimestamp + "." + payload;
        byte[] rawHmac = mac.doFinal(toSign.getBytes("UTF-8"));
        return "v1," + Base64.getEncoder().encodeToString(rawHmac);
    }

    @Test
    void testHandleClerkWebhook_whenSignatureInvalid_shouldReturn400BadRequest() throws Exception {
        String payload = "{\"type\":\"user.created\",\"data\":{\"id\":\"user_123\",\"email_addresses\":[{\"email_address\":\"test@example.com\"}]}}";

        mockMvc.perform(post("/api/v1/webhooks/clerk")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("svix-id", "msg_123")
                .header("svix-timestamp", "1620000000")
                .header("svix-signature", "v1,invalid_signature_here"))
                .andExpect(status().isBadRequest());

        // Verificando que o repositório não foi chamado para salvar nada
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testHandleClerkWebhook_whenUserCreated_shouldSaveUserAndSendWelcomeEmail() throws Exception {
        String payload = "{\"type\":\"user.created\",\"data\":{\"id\":\"user_created_123\",\"email_addresses\":[{\"email_address\":\"newuser@example.com\"}]}}";
        String svixId = "evt_created_123";
        String svixTimestamp = String.valueOf(System.currentTimeMillis() / 1000);
        String svixSignature = generateSvixSignature(svixId, svixTimestamp, payload);

        mockMvc.perform(post("/api/v1/webhooks/clerk")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("svix-id", svixId)
                .header("svix-timestamp", svixTimestamp)
                .header("svix-signature", svixSignature))
                .andExpect(status().isOk());

        // Verificar banco local (save chamado com dados corretos)
        verify(userRepository, times(1)).save(argThat(user -> 
                user.getId().equals("user_created_123") &&
                user.getEmail().equals("newuser@example.com") &&
                user.getPlanType().equals("PAY_PER_USE")
        ));

        // Verificar disparo do e-mail de boas-vindas
        verify(emailService, times(1)).sendWelcomeEmail(eq("newuser@example.com"), any());
    }

    @Test
    void testHandleClerkWebhook_whenUserUpdated_shouldUpdateEmail() throws Exception {
        User existingUser = new User();
        existingUser.setId("user_update_123");
        existingUser.setEmail("old@example.com");
        existingUser.setPlanType("PAY_PER_USE");

        when(userRepository.findById("user_update_123")).thenReturn(Optional.of(existingUser));

        String payload = "{\"type\":\"user.updated\",\"data\":{\"id\":\"user_update_123\",\"email_addresses\":[{\"email_address\":\"new_email@example.com\"}]}}";
        String svixId = "evt_updated_123";
        String svixTimestamp = String.valueOf(System.currentTimeMillis() / 1000);
        String svixSignature = generateSvixSignature(svixId, svixTimestamp, payload);

        mockMvc.perform(post("/api/v1/webhooks/clerk")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("svix-id", svixId)
                .header("svix-timestamp", svixTimestamp)
                .header("svix-signature", svixSignature))
                .andExpect(status().isOk());

        // Verificar banco local atualizado
        verify(userRepository, times(1)).save(argThat(user -> 
                user.getId().equals("user_update_123") &&
                user.getEmail().equals("new_email@example.com")
        ));

        // user.updated não deve enviar e-mail de boas-vindas
        verify(emailService, never()).sendWelcomeEmail(anyString(), any());
    }
}
