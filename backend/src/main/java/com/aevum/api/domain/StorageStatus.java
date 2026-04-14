package com.aevum.api.domain;

public enum StorageStatus {
    DRAFT,          // Arquivos na Standard Class (Rascunho)
    FROZEN,         // Arquivos na Glacier Deep Archive (Lacrado)
    RESTORING,      // Usuário ativou earlyUnlock, extraindo do Glacier (demora 12-48h)
    AVAILABLE       // Arquivos de volta à Standard Class (Prontos pra consumo)
}
