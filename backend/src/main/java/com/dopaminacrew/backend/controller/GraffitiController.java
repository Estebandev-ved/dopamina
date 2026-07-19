package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Graffiti;
import com.dopaminacrew.backend.repository.GraffitiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class GraffitiController {

    @Autowired
    private GraffitiRepository graffitiRepository;

    @GetMapping("/api/public/graffiti")
    public ResponseEntity<List<Graffiti>> getActiveGraffiti() {
        return ResponseEntity.ok(graffitiRepository.findByActivoTrueOrderByCreatedAtDesc());
    }

    @GetMapping("/api/admin/graffiti")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<List<Graffiti>> getAllGraffitiForAdmin() {
        return ResponseEntity.ok(graffitiRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/api/admin/graffiti")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> createGraffiti(@RequestBody Graffiti graffiti) {
        if (graffiti.getTitulo() == null || graffiti.getTitulo().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("El título es obligatorio."));
        }
        if (graffiti.getLatitud() == null || graffiti.getLongitud() == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Latitud y longitud son obligatorias."));
        }
        Graffiti saved = graffitiRepository.save(graffiti);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/api/admin/graffiti/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> updateGraffiti(@PathVariable Long id, @RequestBody Graffiti details) {
        Graffiti graffiti = graffitiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Graffiti no encontrado con id: " + id));
        graffiti.setTitulo(details.getTitulo());
        graffiti.setArtista(details.getArtista());
        graffiti.setDescripcion(details.getDescripcion());
        graffiti.setImagenUrl(details.getImagenUrl());
        graffiti.setUbicacion(details.getUbicacion());
        graffiti.setLatitud(details.getLatitud());
        graffiti.setLongitud(details.getLongitud());
        graffiti.setTags(details.getTags());
        graffiti.setActivo(details.getActivo());
        Graffiti saved = graffitiRepository.save(graffiti);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/api/admin/graffiti/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> deleteGraffiti(@PathVariable Long id) {
        Graffiti graffiti = graffitiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Graffiti no encontrado con id: " + id));
        graffiti.setActivo(false);
        graffitiRepository.save(graffiti);
        return ResponseEntity.ok(new MessageResponse("Graffiti desactivado correctamente."));
    }

    @DeleteMapping("/api/admin/graffiti/{id}/hard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> hardDeleteGraffiti(@PathVariable Long id) {
        graffitiRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("Graffiti eliminado permanentemente."));
    }
}
