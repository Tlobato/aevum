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

import java.time.Duration;

@Service
public class StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket:aevum-storage-bucket}")
    private String bucketName;

    public StorageService() {
        // Na prática de produção, configuraríamos credenciais/region via variáveis de ambiente.
        // Por hora, inicializamos mockado ou com Standard configuration que usaria o ~/.aws/credentials.
        // NOTA: Para rodar localmente sem S3 real, isso daria erro de credenciais.
        // Num ambiente de Dev real, poderíamos usar MinIO ou LocalStack mock.
        // Aqui deixamos os imports prontos.
        this.s3Client = S3Client.create();
        this.s3Presigner = S3Presigner.create();
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
                RestoreObjectRequest restoreObjectRequest = RestoreObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .restoreRequest(RestoreRequest.builder().days(7)
                        .glacierJobParameters(GlacierJobParameters.builder().tier(Tier.STANDARD).build()).build())
                        .build();

                s3Client.restoreObject(restoreObjectRequest);

            } catch (Exception e) {
                 // Log error
            }
        }
    }
}
