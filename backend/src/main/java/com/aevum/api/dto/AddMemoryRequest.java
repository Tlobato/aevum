package com.aevum.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AddMemoryRequest(
    @NotBlank(message = "{memory.type.required}")
    @Pattern(regexp = "^(TEXT|PHOTO|AUDIO|VIDEO)$", message = "{memory.type.pattern}")
    String type,

    String textContent,

    String fileName,
    
    long sizeBytes
) {}
