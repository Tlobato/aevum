package com.aevum.api.exception;

public class UserSyncPendingException extends RuntimeException {
    public UserSyncPendingException(String message) {
        super(message);
    }
}
