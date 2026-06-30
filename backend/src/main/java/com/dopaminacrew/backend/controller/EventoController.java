package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.EventoRequest;
import com.dopaminacrew.backend.dto.EventoResponse;
import com.dopaminacrew.backend.service.impl.EventoServiceImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * EventoController — REST endpoints for events.
 *
 * Security Notes:
 * - GET /api/public/eventos/** → public, no auth required.
 * - POST/PUT/DELETE /api/admin/eventos/** → ROLE_ADMIN only via @PreAuthorize + SecurityConfig.
 * - Input validated with @Valid to prevent malformed data.
 */
@RestController
public class EventoController {

    @Autowired
    private EventoServiceImpl eventoService;

    // ── Public endpoints ──────────────────────────────────────────────────────

    /** Returns all active upcoming events. Accessible without login. */
    @GetMapping("/api/public/eventos")
    public ResponseEntity<List<EventoResponse>> getProximosEventos() {
        return ResponseEntity.ok(eventoService.getProximosEventos());
    }

    /** Returns featured events for the home page widget. */
    @GetMapping("/api/public/eventos/destacados")
    public ResponseEntity<List<EventoResponse>> getDestacados() {
        return ResponseEntity.ok(eventoService.getEventosDestacados());
    }

    /** Returns a single event by ID. */
    @GetMapping("/api/public/eventos/{id}")
    public ResponseEntity<EventoResponse> getEvento(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(eventoService.getEventoById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Admin endpoints ───────────────────────────────────────────────────────

    /** Admin: get all events (including inactive). */
    @GetMapping("/api/admin/eventos")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<List<EventoResponse>> getAllAdmin() {
        return ResponseEntity.ok(eventoService.getAllEventosAdmin());
    }

    /** Admin: create a new event. */
    @PostMapping("/api/admin/eventos")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<EventoResponse> crear(@Valid @RequestBody EventoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventoService.crearEvento(req));
    }

    /** Admin: update an existing event. */
    @PutMapping("/api/admin/eventos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<EventoResponse> actualizar(@PathVariable Long id,
                                                      @Valid @RequestBody EventoRequest req) {
        try {
            return ResponseEntity.ok(eventoService.actualizarEvento(id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Admin: toggle activo/inactivo without deleting. */
    @PatchMapping("/api/admin/eventos/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<EventoResponse> toggle(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(eventoService.toggleActivo(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Admin: permanently delete an event. */
    @DeleteMapping("/api/admin/eventos/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        try {
            eventoService.eliminarEvento(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
