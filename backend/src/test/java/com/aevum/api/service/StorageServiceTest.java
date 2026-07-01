package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.MemoryItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.StorageClass;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
class StorageServiceTest {

    @Autowired
    private StorageService storageService;

    @MockitoBean
    private S3Client s3Client;

    private Capsule capsule;

    @BeforeEach
    void setUp() {
        capsule = new Capsule();
        capsule.setId(UUID.randomUUID());
        capsule.setTitle("Capsula Teste Hibrida");
        capsule.setCreatedAt(LocalDateTime.now());
        
        MemoryItem item = new MemoryItem();
        item.setFileName("foto.jpg");
        item.setSizeBytes(2048L);
        
        capsule.setItems(new ArrayList<>());
        capsule.getItems().add(item);
    }

    @Test
    void testFreezeCapsuleFiles_whenUnlockDateLessThan30Days_shouldUseStandardStorageClass() {
        // Configura desbloqueio para daqui a 10 dias (< 30 dias)
        capsule.setUnlockDate(LocalDateTime.now().plusDays(10));

        storageService.freezeCapsuleFiles(capsule);

        ArgumentCaptor<CopyObjectRequest> captor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client, times(1)).copyObject(captor.capture());
        
        CopyObjectRequest capturedReq = captor.getValue();
        assertEquals(StorageClass.STANDARD, capturedReq.storageClass());
    }

    @Test
    void testFreezeCapsuleFiles_whenUnlockDateMoreThanOrEqualTo30Days_shouldUseDeepArchiveStorageClass() {
        // Configura desbloqueio para daqui a 45 dias (>= 30 dias)
        capsule.setUnlockDate(LocalDateTime.now().plusDays(45));

        storageService.freezeCapsuleFiles(capsule);

        ArgumentCaptor<CopyObjectRequest> captor = ArgumentCaptor.forClass(CopyObjectRequest.class);
        verify(s3Client, times(1)).copyObject(captor.capture());
        
        CopyObjectRequest capturedReq = captor.getValue();
        assertEquals(StorageClass.DEEP_ARCHIVE, capturedReq.storageClass());
    }
}
