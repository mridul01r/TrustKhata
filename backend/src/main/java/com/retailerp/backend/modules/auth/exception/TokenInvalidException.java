package com.retailerp.backend.modules.auth.exception;

public class TokenInvalidException extends RuntimeException {
    public TokenInvalidException() {
        super("Invalid or already used reset token");
    }
}