package com.dopaminacrew.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@Service
public class FacebookCAPIService {

    private static final Logger logger = LoggerFactory.getLogger(FacebookCAPIService.class);
    private static final String GRAPH_API_VERSION = "v21.0";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${facebook.pixel.id:1667872257652141}")
    private String pixelId;

    @Value("${facebook.access.token:}")
    private String accessToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean sendEvent(String eventName, Map<String, Object> eventParams,
                             Map<String, String> userData, String pageUrl, String clientIp,
                             String userAgent, String fbp, String fbc) {
        if (accessToken == null || accessToken.isBlank()) {
            logger.warn("Facebook CAPI: access token not configured, skipping event: {}", eventName);
            return false;
        }

        try {
            Map<String, Object> event = buildPayload(eventName, eventParams, userData,
                    pageUrl, clientIp, userAgent, fbp, fbc);

            Map<String, Object> payload = new HashMap<>();
            payload.put("data", List.of(event));
            payload.put("access_token", accessToken);

            String url = String.format("https://graph.facebook.com/%s/%s/events",
                    GRAPH_API_VERSION, pixelId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonBody = objectMapper.writeValueAsString(payload);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.debug("Facebook CAPI: event '{}' sent successfully", eventName);
                return true;
            } else {
                logger.warn("Facebook CAPI: event '{}' returned status: {}", eventName, response.getStatusCode());
                return false;
            }
        } catch (Exception e) {
            logger.error("Facebook CAPI: failed to send event '{}': {}", eventName, e.getMessage());
            return false;
        }
    }

    private Map<String, Object> buildPayload(String eventName, Map<String, Object> eventParams,
                                             Map<String, String> userData, String pageUrl,
                                             String clientIp, String userAgent,
                                             String fbp, String fbc) {
        Map<String, Object> event = new HashMap<>();

        event.put("event_name", eventName);
        event.put("event_time", Instant.now().getEpochSecond());
        event.put("action_source", "website");
        event.put("event_source_url", pageUrl);

        if (clientIp != null && !clientIp.isBlank()) {
            event.put("user_ip", clientIp);
        }
        if (userAgent != null && !userAgent.isBlank()) {
            event.put("user_agent", userAgent);
        }

        // User data (already SHA-256 hashed from frontend)
        Map<String, Object> user = new HashMap<>();
        if (userData != null) {
            if (userData.containsKey("em") && !userData.get("em").isBlank()) {
                user.put("em", List.of(userData.get("em")));
            }
            if (userData.containsKey("ph") && !userData.get("ph").isBlank()) {
                user.put("ph", List.of(userData.get("ph")));
            }
        }
        if (fbp != null && !fbp.isBlank()) {
            user.put("fbp", List.of(fbp));
        }
        if (fbc != null && !fbc.isBlank()) {
            user.put("fbc", List.of(fbc));
        }
        event.put("user_data", user);

        Map<String, Object> customData = new HashMap<>();
        if (eventParams != null) {
            customData.putAll(eventParams);
        }
        if (!customData.containsKey("currency")) {
            customData.put("currency", "COP");
        }
        event.put("custom_data", customData);

        return event;
    }
}
