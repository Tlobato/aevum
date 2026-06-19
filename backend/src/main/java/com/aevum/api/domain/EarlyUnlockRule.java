package com.aevum.api.domain;

public enum EarlyUnlockRule {
    TOTAL_LOCK,       // Bloqueio Total
    CREATOR_ONLY,     // Apenas o Criador / Chave de Emergência
    ALLOW_RECIPIENT   // Permitir Destinatário
}
