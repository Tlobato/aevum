package com.aevum.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AddMemoryRequest(
    @NotBlank(message = "Memory type is required")
    @Pattern(regexp = "^(TEXT|PHOTO|AUDIO|VIDEO)$", message = "Type must be TEXT, PHOTO, AUDIO, or VIDEO")
    String type,

    String textContent,

    String fileName,
    
    long sizeBytes
) {}
