package com.retailerp.backend.modules.auth.exception;

public class TokenExpiredException extends RuntimeException {
    public TokenExpiredException() {
        super("Reset token has expired. Please request a new one.");
    }
}