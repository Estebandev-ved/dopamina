package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.dto.SugerenciaRequest;
import com.dopaminacrew.backend.dto.SugerenciaResponse;
import com.dopaminacrew.backend.service.SugerenciaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SugerenciaController {

    @Autowired
    private SugerenciaService sugerenciaService;

    @PostMapping("/public/sugerencias")
    public ResponseEntity<?> crearSugerencia(@Valid @RequestBody SugerenciaRequest request,
                                              BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(errors);
        }
        SugerenciaResponse response = sugerenciaService.crearSugerencia(
                request.getContenido(), request.getNombre(), request.getEmail());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/sugerencias")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SugerenciaResponse>> getTodasSugerencias() {
        return ResponseEntity.ok(sugerenciaService.getTodasSugerencias());
    }

    @PutMapping("/admin/sugerencias/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id,
                                               @RequestBody Map<String, String> body) {
        String estado = body.get("estado");
        if (estado == null || estado.isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("El estado es obligatorio."));
        }
        try {
            SugerenciaResponse response = sugerenciaService.actualizarEstado(id, estado);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }
}
