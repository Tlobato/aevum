package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.MemoryItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;

@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket:aevum-storage-bucket}")
    private String bucketName;

    public StorageService(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }


    public String generatePresignedUploadUrl(String capsuleId, String fileName, long sizeBytes) {
        String draftKey = "drafts/" + capsuleId + "/" + fileName;

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(draftKey)
                .contentLength(sizeBytes)
                // A Lifecycle policy vai cuidar de apagar os drafts em 24h.
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(objectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        return presignedRequest.url().toString();
    }

    public String generatePresignedGetUrl(String capsuleId, String fileName) {
        String destinationKey = "sealed/" + capsuleId + "/" + fileName;

        GetObjectRequest objectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(destinationKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(60)) // Link válido por 1h
                .getObjectRequest(objectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
    }

    public void freezeCapsuleFiles(Capsule capsule) {
        // Altera arquivos de STANDARD (em /drafts/) para DEEP_ARCHIVE (em /sealed/)
        String capsuleIdStr = capsule.getId().toString();

        // 1. Copia todos os arquivos para o Glacier Deep Archive (Se falhar aqui, o banco faz rollback)
        for (MemoryItem item : capsule.getItems()) {
            if (item.getFileName() == null || item.getFileName().isBlank()) continue;

            String sourceKey = "drafts/" + capsuleIdStr + "/" + item.getFileName();
            String destinationKey = "sealed/" + capsuleIdStr + "/" + item.getFileName();

            try {
                CopyObjectRequest copyReq = CopyObjectRequest.builder()
                        .sourceBucket(bucketName)
                        .sourceKey(sourceKey)
                        .destinationBucket(bucketName)
                        .destinationKey(destinationKey)
                        .storageClass(StorageClass.DEEP_ARCHIVE)
                        .build();

                s3Client.copyObject(copyReq);
                log.info("Selo (AWS): Arquivo copiado com sucesso para o Glacier: {}", destinationKey);
            } catch (NoSuchKeyException e) {
                log.warn("Selo (AWS): Arquivo não encontrado em drafts para movimentar: {}", sourceKey);
            }
        }

        // 2. Remove os rascunhos originais (Operação segura, se falhar o arquivo físico já está garantido no Glacier)
        for (MemoryItem item : capsule.getItems()) {
            if (item.getFileName() == null || item.getFileName().isBlank()) continue;

            String sourceKey = "drafts/" + capsuleIdStr + "/" + item.getFileName();

            try {
                s3Client.deleteObject(d -> d.bucket(bucketName).key(sourceKey));
                log.info("Selo (AWS): Rascunho original deletado: {}", sourceKey);
            } catch (Exception e) {
                log.warn("Selo (AWS): Falha não-crítica ao remover rascunho original {} do S3: {}", sourceKey, e.getMessage());
            }
        }
    }

    public void triggerRestoreTask(Capsule capsule) {
        String capsuleIdStr = capsule.getId().toString();

        for (MemoryItem item : capsule.getItems()) {
            if (item.getFileName() == null || item.getFileName().isBlank()) continue;

            String key = "sealed/" + capsuleIdStr + "/" + item.getFileName();

            try {
                // Solicita o Restore do Glacier.
                // Days = 7 -> A cópia temporária sumirá em 7 dias (T-minus 48h restaurando, sobra 5 dias pro destinatário abrir e ver).
                RestoreObjectRequest restoreRequest = RestoreObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .restoreRequest(r -> r.days(7).glacierJobParameters(g -> g.tier(Tier.STANDARD)))
                        .build();

                s3Client.restoreObject(restoreRequest);
            } catch (Exception e) {
                System.out.println("Erro ao solicitar restore para " + key + ": " + e.getMessage());
            }
        }
    }

    /**
     * Força os arquivos de volta para STANDARD.
     * APENAS para uso via botão Admin (debug/testes).
     * NÃO usar via Stripe webhook — para isso usar triggerRestoreTask.
     */
    public void forceStandardForDebug(Capsule capsule) {
        String capsuleIdStr = capsule.getId().toString();
        for (MemoryItem item : capsule.getItems()) {
            if (item.getFileName() == null || item.getFileName().isBlank()) continue;
            // Arquivos selados ficam em sealed/, não em drafts/
            String sourceKey = "sealed/" + capsuleIdStr + "/" + item.getFileName();

            try {
                CopyObjectRequest copyReq = CopyObjectRequest.builder()
                        .sourceBucket(bucketName)
                        .sourceKey(sourceKey)
                        .destinationBucket(bucketName)
                        .destinationKey(sourceKey) // copia sobre si mesmo mudando a storage class
                        .storageClass(StorageClass.STANDARD)
                        .metadataDirective(MetadataDirective.COPY)
                        .build();
                s3Client.copyObject(copyReq);
                log.info("Debug Unlock (AWS): Arquivo movido para Standard: {}", sourceKey);
            } catch (Exception e) {
                log.error("Erro no override de debug para {}: {}", sourceKey, e.getMessage());
            }
        }
    }

    public void deleteDraftFolder(String capsuleId) {
        deleteFolderWithPrefix("drafts/" + capsuleId + "/");
    }

    public void deleteSealedFolder(String capsuleId) {
        deleteFolderWithPrefix("sealed/" + capsuleId + "/");
    }

    private void deleteFolderWithPrefix(String prefix) {
        try {
            var listRes = s3Client.listObjectsV2(b -> b.bucket(bucketName).prefix(prefix));
            for (var obj : listRes.contents()) {
                s3Client.deleteObject(b -> b.bucket(bucketName).key(obj.key()));
                log.info("Lixeira (AWS): Deletado objeto {}", obj.key());
            }
        } catch (Exception e) {
            log.error("Erro ao deletar prefixo {} na S3", prefix, e);
        }
    }
}
