package com.aevum.api.dto;

import com.aevum.api.domain.MemoryItem;

import java.util.UUID;

public record MemoryResponse(
    UUID id,
    String type,
    String textContent,
    String fileName,
    long sizeBytes,
    String presignedGetUrl
) {
    public static MemoryResponse fromEntity(MemoryItem item, String presignedGetUrl) {
        return new MemoryResponse(
            item.getId(),
            item.getType().name(),
            item.getContentPayload(), // Para notas de texto curto
            item.getFileName(),
            item.getSizeBytes(),
            presignedGetUrl
        );
    }
}
