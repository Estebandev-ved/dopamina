package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.model.VisitaPagina;
import com.dopaminacrew.backend.service.VisitaPaginaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/visitas")
public class VisitaPaginaController {

    @Autowired
    private VisitaPaginaService visitaPaginaService;

    @PostMapping("/track")
    public ResponseEntity<Map<String, Object>> trackVisit(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            HttpServletRequest request) {

        String pagina = (String) body.getOrDefault("pagina", "/");
        String titulo = (String) body.get("titulo");
        Long usuarioId = userIdHeader;
        if (body.get("usuarioId") != null) {
            usuarioId = ((Number) body.get("usuarioId")).longValue();
        }

        visitaPaginaService.registrarVisita(pagina, titulo, usuarioId, request);

        Map<String, Object> res = new HashMap<>();
        res.put("ok", true);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVisitas", visitaPaginaService.contarVisitasTotales());
        stats.put("visitasHoy", visitaPaginaService.contarVisitasHoy());
        stats.put("autenticados", visitaPaginaService.contarAutenticados());
        stats.put("anonimos", visitaPaginaService.contarAnonimos());
        stats.put("porPagina", visitaPaginaService.contarPorPagina());
        stats.put("porDia", visitaPaginaService.contarPorDia());
        return ResponseEntity.ok(stats);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<VisitaPagina>> getAllVisits() {
        return ResponseEntity.ok(visitaPaginaService.obtenerTodas());
    }
}
