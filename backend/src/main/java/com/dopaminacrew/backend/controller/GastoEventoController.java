package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.GastoEventoRequest;
import com.dopaminacrew.backend.dto.GastoEventoResponse;
import com.dopaminacrew.backend.service.impl.GastoEventoServiceImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
public class GastoEventoController {

    @Autowired
    private GastoEventoServiceImpl gastoEventoService;

    /** Get all gastos for a specific event. */
    @GetMapping("/api/admin/eventos/{eventoId}/gastos")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<List<GastoEventoResponse>> getGastos(@PathVariable Long eventoId) {
        return ResponseEntity.ok(gastoEventoService.getGastosByEvento(eventoId));
    }

    /** Create a new gasto for a specific event. */
    @PostMapping("/api/admin/eventos/{eventoId}/gastos")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<GastoEventoResponse> crearGasto(
            @PathVariable Long eventoId,
            @Valid @RequestBody GastoEventoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gastoEventoService.crearGasto(eventoId, req));
    }

    /** Update an existing gasto. */
    @PutMapping("/api/admin/eventos/{eventoId}/gastos/{gastoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<GastoEventoResponse> actualizarGasto(
            @PathVariable Long eventoId,
            @PathVariable Long gastoId,
            @Valid @RequestBody GastoEventoRequest req) {
        try {
            return ResponseEntity.ok(gastoEventoService.actualizarGasto(eventoId, gastoId, req));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Delete a gasto. */
    @DeleteMapping("/api/admin/eventos/{eventoId}/gastos/{gastoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<Void> eliminarGasto(
            @PathVariable Long eventoId,
            @PathVariable Long gastoId) {
        try {
            gastoEventoService.eliminarGasto(eventoId, gastoId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Copy gastos from one event to another (template). */
    @PostMapping("/api/admin/eventos/{eventoId}/gastos/copy")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<Map<String, String>> copiarGastos(
            @PathVariable Long eventoId,
            @RequestBody Map<String, Long> body) {
        Long origenId = body.get("origenId");
        if (origenId == null) {
            return ResponseEntity.badRequest().build();
        }
        gastoEventoService.copiarGastos(origenId, eventoId);
        return ResponseEntity.ok(Map.of("message", "Gastos copiados exitosamente"));
    }
}
