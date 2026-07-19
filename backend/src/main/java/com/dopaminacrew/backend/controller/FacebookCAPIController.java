package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.FacebookCAPIRequest;
import com.dopaminacrew.backend.service.FacebookCAPIService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class FacebookCAPIController {

    @Autowired
    private FacebookCAPIService facebookCAPIService;

    @PostMapping("/public/facebook/capi")
    public ResponseEntity<Map<String, Object>> sendCAPIEvent(
            @RequestBody FacebookCAPIRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String fbp = extractCookie(httpRequest, "_fbp");
        String fbc = extractCookie(httpRequest, "_fbc");

        boolean sent = facebookCAPIService.sendEvent(
                request.getEventName(),
                request.getEventParams(),
                request.getUserData(),
                request.getPageUrl(),
                clientIp,
                userAgent,
                fbp,
                fbc
        );

        return ResponseEntity.ok(Map.of(
                "success", sent,
                "event", request.getEventName() != null ? request.getEventName() : "unknown"
        ));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
