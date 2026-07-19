package com.dopaminacrew.backend.dto;

import java.util.Map;

public class FacebookCAPIRequest {
    private String eventName;
    private Map<String, Object> eventParams;
    private Map<String, String> userData;
    private String pageUrl;
    private String referrer;

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }
    public Map<String, Object> getEventParams() { return eventParams; }
    public void setEventParams(Map<String, Object> eventParams) { this.eventParams = eventParams; }
    public Map<String, String> getUserData() { return userData; }
    public void setUserData(Map<String, String> userData) { this.userData = userData; }
    public String getPageUrl() { return pageUrl; }
    public void setPageUrl(String pageUrl) { this.pageUrl = pageUrl; }
    public String getReferrer() { return referrer; }
    public void setReferrer(String referrer) { this.referrer = referrer; }
}
