package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.ArtistaRequest;
import com.dopaminacrew.backend.dto.ArtistaResponse;
import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.service.ArtistaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller exposing endpoints for managing catalog of artists.
 * Security Notes:
 * - Public endpoint /api/public/artistas allows viewing local artists.
 * - Admin endpoints are protected by ROLE_ADMIN role.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class ArtistaController {

    @Autowired
    private ArtistaService artistaService;

    // ── Public Endpoints ──────────────────────────────────────────────────────

    @GetMapping("/public/artistas")
    public ResponseEntity<List<ArtistaResponse>> getArtistasPublicos() {
        return ResponseEntity.ok(artistaService.getArtistasPublicos());
    }

    // ── Admin Endpoints ───────────────────────────────────────────────────────

    @GetMapping("/admin/artistas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ArtistaResponse>> getAllArtistasAdmin() {
        return ResponseEntity.ok(artistaService.getAllArtistasAdmin());
    }

    @PostMapping("/admin/artistas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crearArtista(@Valid @RequestBody ArtistaRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(errors);
        }
        ArtistaResponse response = artistaService.crearArtista(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/admin/artistas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizarArtista(@PathVariable Long id,
                                               @Valid @RequestBody ArtistaRequest request,
                                               BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(errors);
        }
        try {
            ArtistaResponse response = artistaService.actualizarArtista(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(ex.getMessage()));
        }
    }

    @DeleteMapping("/admin/artistas/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> eliminarArtista(@PathVariable Long id) {
        try {
            artistaService.eliminarArtista(id);
            return ResponseEntity.ok(new MessageResponse("Artista eliminado con éxito."));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(ex.getMessage()));
        }
    }
}
