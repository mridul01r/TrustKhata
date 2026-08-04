package com.retailerp.backend.modules.settings.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.retailerp.backend.modules.settings.entity.BusinessSettings;

public class BusinessSettingsResponse {

    private String businessName;
    private String gstin;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private String email;
    private boolean trackInventory = true;

    public static BusinessSettingsResponse fromEntity(BusinessSettings settings) {
        BusinessSettingsResponse response = new BusinessSettingsResponse();
        response.businessName = settings.getBusinessName();
        response.gstin = settings.getGstin();
        response.addressLine1 = settings.getAddressLine1();
        response.addressLine2 = settings.getAddressLine2();
        response.city = settings.getCity();
        response.state = settings.getState();
        response.pincode = settings.getPincode();
        response.phone = settings.getPhone();
        response.email = settings.getEmail();
        response.trackInventory = settings.isTrackInventory();
        return response;
    }

    public static BusinessSettingsResponse empty() {
        return new BusinessSettingsResponse();
    }

    public String getBusinessName() {
        return businessName;
    }

    public String getGstin() {
        return gstin;
    }

    public String getAddressLine1() {
        return addressLine1;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getPincode() {
        return pincode;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    @JsonProperty("trackInventory")
    public boolean isTrackInventory() {
        return trackInventory;
    }
}