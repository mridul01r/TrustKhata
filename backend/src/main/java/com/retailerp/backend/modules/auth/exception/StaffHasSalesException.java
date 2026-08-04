package com.retailerp.backend.modules.auth.exception;

public class StaffHasSalesException extends RuntimeException {
    public StaffHasSalesException() {
        super("This staff member has sales recorded against them and cannot be deleted. Deactivate the account instead.");
    }
}