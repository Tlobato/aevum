package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.CapsulePlan;
import com.aevum.api.domain.CapsuleStatus;
import com.aevum.api.domain.User;
import com.aevum.api.dto.CapsuleCreateRequest;
import com.aevum.api.dto.CapsuleResponse;
import com.aevum.api.dto.CapsuleUpdateRequest;
import com.aevum.api.exception.AccessDeniedException;
import com.aevum.api.repository.CapsuleRepository;
import com.aevum.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CapsuleServiceTest {

    @Autowired
    private CapsuleService capsuleService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CapsuleRepository capsuleRepository;

    @MockitoBean
    private StorageService storageService;

    private User owner;
    private User recipient;

    @BeforeEach
    void setUp() {
        capsuleRepository.deleteAll();
        userRepository.deleteAll();

        owner = new User();
        owner.setId("user_owner_123");
        owner.setEmail("owner@example.com");
        owner = userRepository.save(owner);

        recipient = new User();
        recipient.setId("user_recipient_456");
        recipient.setEmail("recipient@example.com");
        recipient = userRepository.save(recipient);
    }

    @Test
    void testCreateDraft_whenUnlockDateLessThan1Day_shouldThrowException() {
        // Criar uma data de hoje no fuso de SP (inválido, precisa ser no mínimo amanhã)
        ZoneId zoneId = ZoneId.of("America/Sao_Paulo");
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        LocalDateTime unlockDate = now.plusMinutes(30).toLocalDateTime();

        CapsuleCreateRequest request = new CapsuleCreateRequest(
                "Minha Cápsula Crítica",
                "Descrição",
                unlockDate,
                "recipient@example.com",
                "Pedro",
                null,
                "CHRONOS_2GB",
                false,
                true,
                "Mensagem Surpresa Secreta",
                "TOTAL_LOCK",
                "America/Sao_Paulo"
        );

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            capsuleService.createDraft(request, owner.getId(), owner.getEmail());
        });

        assertEquals("capsule.unlockDate.min1day", exception.getMessage());
    }

    @Test
    void testCreateDraft_whenGiftCapsule_andRecipientNameBlank_shouldThrowException() {
        ZoneId zoneId = ZoneId.of("America/Sao_Paulo");
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        LocalDateTime unlockDate = now.plusDays(1).plusHours(2).toLocalDateTime();

        CapsuleCreateRequest request = new CapsuleCreateRequest(
                "Minha Cápsula Crítica",
                "Descrição",
                unlockDate,
                "recipient@example.com",
                "", // Nome em branco (inválido!)
                null,
                "CHRONOS_2GB",
                false,
                true, // isGift
                "Mensagem Surpresa Secreta",
                "TOTAL_LOCK",
                "America/Sao_Paulo"
        );

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            capsuleService.createDraft(request, owner.getId(), owner.getEmail());
        });

        assertEquals("capsule.recipientName.notblank", exception.getMessage());
    }

    @Test
    void testCreateDraft_whenUnlockDateMoreThan1Day_shouldSucceed() {
        ZoneId zoneId = ZoneId.of("America/Sao_Paulo");
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        LocalDateTime unlockDate = now.plusDays(1).plusHours(2).toLocalDateTime(); // amanhã no futuro

        CapsuleCreateRequest request = new CapsuleCreateRequest(
                "Minha Cápsula Crítica Válida",
                "Descrição",
                unlockDate,
                "recipient@example.com",
                "Pedro",
                null,
                "CHRONOS_2GB",
                false,
                true,
                "Mensagem Surpresa Secreta",
                "TOTAL_LOCK",
                "America/Sao_Paulo"
        );

        CapsuleResponse response = capsuleService.createDraft(request, owner.getId(), owner.getEmail());
        assertNotNull(response);
        assertEquals("Minha Cápsula Crítica Válida", response.title());
        assertEquals("DRAFT", response.status());
    }

    @Test
    void testUpdateCapsule_whenUnlockDateLessThan1Day_shouldThrowException() {
        ZoneId zoneId = ZoneId.of("America/Sao_Paulo");
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        LocalDateTime initialUnlockDate = now.plusDays(1).plusHours(2).toLocalDateTime();

        CapsuleCreateRequest createRequest = new CapsuleCreateRequest(
                "Cápsula Rascunho",
                "Descrição",
                initialUnlockDate,
                "recipient@example.com",
                "Pedro",
                null,
                "CHRONOS_2GB",
                false,
                true,
                "Mensagem Surpresa Secreta",
                "TOTAL_LOCK",
                "America/Sao_Paulo"
        );

        CapsuleResponse createResponse = capsuleService.createDraft(createRequest, owner.getId(), owner.getEmail());
        UUID capsuleId = createResponse.id();

        // Tenta atualizar para a data de hoje (inválida)
        LocalDateTime invalidUnlockDate = now.plusMinutes(30).toLocalDateTime();
        CapsuleUpdateRequest updateRequest = new CapsuleUpdateRequest(
                "Novo Título",
                "recipient@example.com",
                "Pedro",
                invalidUnlockDate,
                "America/Sao_Paulo"
        );

        Jwt jwt = Jwt.withTokenValue("mock-token")
                .header("alg", "none")
                .claim("sub", owner.getId())
                .claim("email", owner.getEmail())
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            capsuleService.updateCapsule(capsuleId, updateRequest, jwt);
        });

        assertEquals("capsule.unlockDate.min1day", exception.getMessage());
    }

    @Test
    void testGetMemoriesWithUrls_whenUserNotOwnerOrRecipient_shouldThrowAccessDenied() {
        // Criar uma cápsula selada com data no futuro
        Capsule capsule = new Capsule();
        capsule.setOwner(owner);
        capsule.setTitle("Segredo de Estado");
        capsule.setPlanType(CapsulePlan.CHRONOS_2GB);
        capsule.setUnlockDate(LocalDateTime.now().plusDays(5));
        capsule.setRecipientEmail("recipient@example.com");
        capsule.setTargetTimezone("America/Sao_Paulo");
        capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(com.aevum.api.domain.StorageStatus.FROZEN);
        capsule = capsuleRepository.save(capsule);

        UUID capsuleId = capsule.getId();

        // Tenta acessar com um terceiro usuário logado
        AccessDeniedException exception = assertThrows(AccessDeniedException.class, () -> {
            capsuleService.getMemoriesWithUrls(capsuleId, "user_intruder_999", "intruder@example.com", storageService);
        });

        assertEquals("capsule.memories.denied", exception.getMessage());
    }

    @Test
    void testSanitizePayload_whenCapsuleSealedOrRestoringForRecipient_shouldHideSensitiveData() {
        // Criar cápsula selada
        Capsule capsule = new Capsule();
        capsule.setOwner(owner);
        capsule.setTitle("Presente Selado");
        capsule.setPlanType(CapsulePlan.CHRONOS_2GB);
        capsule.setUnlockDate(LocalDateTime.now().plusDays(5));
        capsule.setRecipientEmail("recipient@example.com");
        capsule.setTargetTimezone("America/Sao_Paulo");
        capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(com.aevum.api.domain.StorageStatus.FROZEN);
        capsule.setGift(true);
        capsule.setOwnerMessage("Esta é uma mensagem surpresa altamente secreta!");
        capsule.setAccessToken(UUID.randomUUID());
        capsule = capsuleRepository.save(capsule);
        final UUID targetId = capsule.getId();

        // Listar cápsulas simulando o destinatário
        List<CapsuleResponse> responses = capsuleService.listMyCapsules(recipient.getId(), recipient.getEmail());
        
        assertFalse(responses.isEmpty());
        CapsuleResponse response = responses.stream()
                .filter(c -> c.id().equals(targetId))
                .findFirst()
                .orElse(null);

        assertNotNull(response);
        // O destinatário não deve conseguir ver a mensagem e nem o token enquanto estiver selada
        assertNull(response.ownerMessage());
        assertNull(response.accessToken());

        // Agora simula o proprietário (criador), que deve ver os dados normalmente
        List<CapsuleResponse> ownerResponses = capsuleService.listMyCapsules(owner.getId(), owner.getEmail());
        CapsuleResponse ownerResponse = ownerResponses.stream()
                .filter(c -> c.id().equals(targetId))
                .findFirst()
                .orElse(null);

        assertNotNull(ownerResponse);
        assertEquals("Esta é uma mensagem surpresa altamente secreta!", ownerResponse.ownerMessage());
        assertNotNull(ownerResponse.accessToken());
    }

    @Test
    void testUpdateCapsule_whenSealed_andFvaMissingOrOld_shouldThrowClerkReverificationRequiredException() {
        // Criar uma cápsula já selada
        Capsule capsule = new Capsule();
        capsule.setOwner(owner);
        capsule.setTitle("Minha Cápsula Selada");
        capsule.setPlanType(CapsulePlan.CHRONOS_2GB);
        capsule.setUnlockDate(LocalDateTime.now().plusDays(5));
        capsule.setRecipientEmail("recipient@example.com");
        capsule.setTargetTimezone("America/Sao_Paulo");
        capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(com.aevum.api.domain.StorageStatus.FROZEN);
        capsule = capsuleRepository.save(capsule);

        UUID capsuleId = capsule.getId();

        // 1. Caso claim fva esteja ausente
        CapsuleUpdateRequest updateRequest = new CapsuleUpdateRequest(
                null,
                "new_recipient@example.com",
                "Pedro Novo",
                null,
                null
        );

        Jwt jwtMissingFva = Jwt.withTokenValue("mock-token")
                .header("alg", "none")
                .claim("sub", owner.getId())
                .claim("email", owner.getEmail())
                // fva não incluído
                .build();

        assertThrows(com.aevum.api.exception.ClerkReverificationRequiredException.class, () -> {
            capsuleService.updateCapsule(capsuleId, updateRequest, jwtMissingFva);
        });

        // 2. Caso fva esteja presente mas tenha idade >= 10 minutos (ex: 15)
        Jwt jwtOldFva = Jwt.withTokenValue("mock-token")
                .header("alg", "none")
                .claim("sub", owner.getId())
                .claim("email", owner.getEmail())
                .claim("fva", List.of(15)) // 15 minutos
                .build();

        assertThrows(com.aevum.api.exception.ClerkReverificationRequiredException.class, () -> {
            capsuleService.updateCapsule(capsuleId, updateRequest, jwtOldFva);
        });
    }

    @Test
    void testUpdateCapsule_whenSealed_andFvaRecent_shouldSucceed() {
        // Criar uma cápsula já selada
        Capsule capsule = new Capsule();
        capsule.setOwner(owner);
        capsule.setTitle("Minha Cápsula Selada II");
        capsule.setPlanType(CapsulePlan.CHRONOS_2GB);
        capsule.setUnlockDate(LocalDateTime.now().plusDays(5));
        capsule.setRecipientEmail("recipient@example.com");
        capsule.setTargetTimezone("America/Sao_Paulo");
        capsule.setEarlyUnlockRule(com.aevum.api.domain.EarlyUnlockRule.TOTAL_LOCK);
        capsule.setStatus(CapsuleStatus.SEALED);
        capsule.setStorageStatus(com.aevum.api.domain.StorageStatus.FROZEN);
        capsule = capsuleRepository.save(capsule);

        UUID capsuleId = capsule.getId();

        CapsuleUpdateRequest updateRequest = new CapsuleUpdateRequest(
                null,
                "new_recipient@example.com",
                "Pedro Novo II",
                null,
                null
        );

        // JWT com fva recente (ex: 2 minutos)
        Jwt jwtRecentFva = Jwt.withTokenValue("mock-token")
                .header("alg", "none")
                .claim("sub", owner.getId())
                .claim("email", owner.getEmail())
                .claim("fva", List.of(2)) // 2 minutos
                .build();

        CapsuleResponse response = capsuleService.updateCapsule(capsuleId, updateRequest, jwtRecentFva);
        
        assertNotNull(response);
        assertEquals("new_recipient@example.com", response.recipientEmail());
    }
}

