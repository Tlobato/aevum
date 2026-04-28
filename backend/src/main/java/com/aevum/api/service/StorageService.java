package com.aevum.api.service;

import com.aevum.api.domain.Capsule;
import com.aevum.api.domain.MemoryItem;
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
            } catch (NoSuchKeyException e) {
                // Ignore failure if file wasn't uploaded or was textual memory
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

    public void forceStandardForDebug(Capsule capsule) {
        String capsuleIdStr = capsule.getId().toString();
        for (MemoryItem item : capsule.getItems()) {
            if (item.getFileName() == null || item.getFileName().isBlank()) continue;
            String sourceKey = "drafts/" + capsuleIdStr + "/" + item.getFileName();
            String destinationKey = "sealed/" + capsuleIdStr + "/" + item.getFileName();
            
            // Delete the DEEP_ARCHIVE object first to avoid LocalStack/S3 state errors during overwrite
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(destinationKey)
                        .build());
            } catch (Exception e) {
                 // ignore delete error
            }

            try {
                CopyObjectRequest copyReq = CopyObjectRequest.builder()
                        .sourceBucket(bucketName)
                        .sourceKey(sourceKey)
                        .destinationBucket(bucketName)
                        .destinationKey(destinationKey)
                        .storageClass(StorageClass.STANDARD)
                        .build();
                s3Client.copyObject(copyReq);
            } catch (Exception e) {
                 System.out.println("Erro no override de debug para " + destinationKey + ": " + e.getMessage());
            }
        }
    }

    public void deleteDraftFolder(String capsuleId) {
        String prefix = "drafts/" + capsuleId + "/";
        try {
            var listRes = s3Client.listObjectsV2(b -> b.bucket(bucketName).prefix(prefix));
            for (var obj : listRes.contents()) {
                s3Client.deleteObject(b -> b.bucket(bucketName).key(obj.key()));
                log.info("Lixeira (AWS): Deletado objeto abandonado {}", obj.key());
            }
        } catch (Exception e) {
            log.error("Erro ao deletar pasta draft da cápsula {}", capsuleId, e);
        }
    }
}
