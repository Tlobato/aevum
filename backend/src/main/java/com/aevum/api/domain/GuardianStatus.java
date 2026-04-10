package com.aevum.api.domain;

public enum GuardianStatus {
    PENDING_INVITE, // O e-mail foi disparado mas ainda não foi aceito
    ACCEPTED,       // Guardião aceitou cuidar dessa cápsula e tem o recovery token
    REJECTED        // Guardião recusou
}
