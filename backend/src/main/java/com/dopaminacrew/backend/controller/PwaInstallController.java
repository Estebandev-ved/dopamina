package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.service.PwaInstallService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
public class PwaInstallController {

    @Autowired
    private PwaInstallService pwaInstallService;

    @PostMapping("/api/public/pwa/install")
    public ResponseEntity<Map<String, Object>> trackInstall(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        String platform = (String) body.getOrDefault("platform", "web");
        pwaInstallService.registrarInstall(platform, request);

        Map<String, Object> res = new HashMap<>();
        res.put("ok", true);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/api/admin/pwa/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<Map<String, Object>> getPwaStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalInstalls", pwaInstallService.contarInstallsTotales());
        stats.put("installsToday", pwaInstallService.contarInstallsHoy());
        stats.put("installsLast30Days", pwaInstallService.contarInstallsUltimos30Dias());
        stats.put("byPlatform", pwaInstallService.contarPorPlataforma());
        return ResponseEntity.ok(stats);
    }
}
