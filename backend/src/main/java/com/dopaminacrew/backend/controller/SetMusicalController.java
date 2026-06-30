package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.dto.SetMusicalRequest;
import com.dopaminacrew.backend.dto.SetMusicalResponse;
import com.dopaminacrew.backend.service.SetMusicalService;
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

@RestController
@RequestMapping("/api")
public class SetMusicalController {

    @Autowired
    private SetMusicalService setMusicalService;

    @GetMapping("/public/sets")
    public ResponseEntity<List<SetMusicalResponse>> getSetsPublicos() {
        return ResponseEntity.ok(setMusicalService.getSetsPublicos());
    }

    @GetMapping("/public/sets/genero/{genero}")
    public ResponseEntity<List<SetMusicalResponse>> getSetsPorGenero(@PathVariable String genero) {
        return ResponseEntity.ok(setMusicalService.getSetsPorGenero(genero));
    }

    @GetMapping("/admin/sets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SetMusicalResponse>> getAllSetsAdmin() {
        return ResponseEntity.ok(setMusicalService.getAllSetsAdmin());
    }

    @PostMapping("/admin/sets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> crearSet(@Valid @RequestBody SetMusicalRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(errors);
        }
        SetMusicalResponse response = setMusicalService.crearSet(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/admin/sets/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizarSet(@PathVariable Long id,
                                           @Valid @RequestBody SetMusicalRequest request,
                                           BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(errors);
        }
        try {
            SetMusicalResponse response = setMusicalService.actualizarSet(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(ex.getMessage()));
        }
    }

    @DeleteMapping("/admin/sets/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> eliminarSet(@PathVariable Long id) {
        try {
            setMusicalService.eliminarSet(id);
            return ResponseEntity.ok(new MessageResponse("Set musical eliminado con éxito."));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(ex.getMessage()));
        }
    }
}
