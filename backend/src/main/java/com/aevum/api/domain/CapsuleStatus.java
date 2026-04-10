package com.aevum.api.domain;

public enum CapsuleStatus {
    DRAFT,      // Sendo editada, arquivos ainda sendo adicionados
    SEALED,     // Selada e trancada, no cofre do Glacier
    UNLOCKED    // Data alcançada, disponível para visualização e download
}
