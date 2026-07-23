package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Combo;
import com.dopaminacrew.backend.repository.ComboRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * REST controller for managing combos (Public & Admin interfaces).
 */
@RestController
public class ComboController {

    @Autowired
    private ComboRepository comboRepository;

    /**
     * Public endpoint: list all active combos.
     */
    @GetMapping("/api/combos")
    public ResponseEntity<List<Combo>> getActiveCombos() {
        List<Combo> combos = comboRepository.findByActivoTrue();
        return ResponseEntity.ok(combos);
    }

    /**
     * Admin endpoint: list all combos (active and inactive).
     */
    @GetMapping("/api/admin/combos/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<List<Combo>> getAllCombosForAdmin() {
        List<Combo> combos = comboRepository.findAll();
        return ResponseEntity.ok(combos);
    }

    /**
     * Admin endpoint: create a new combo.
     */
    @PostMapping("/api/admin/combos")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> createCombo(@RequestBody Combo combo) {
        if (combo.getNombre() == null || combo.getNombre().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("El nombre del combo es obligatorio."));
        }
        if (combo.getPrecio() == null || combo.getPrecio() < 0) {
            return ResponseEntity.badRequest().body(new MessageResponse("El precio debe ser un número válido mayor o igual a 0."));
        }
        if (combo.getCantidadBoletas() == null || combo.getCantidadBoletas() < 1) {
            return ResponseEntity.badRequest().body(new MessageResponse("La cantidad de boletas debe ser mínimo 1."));
        }

        Combo savedCombo = comboRepository.save(combo);
        return ResponseEntity.ok(savedCombo);
    }

    /**
     * Admin endpoint: update an existing combo.
     */
    @PutMapping("/api/admin/combos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> updateCombo(@PathVariable Long id, @RequestBody Combo comboDetails) {
        Optional<Combo> comboOpt = comboRepository.findById(id);
        if (comboOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Combo no encontrado."));
        }

        Combo combo = comboOpt.get();
        if (comboDetails.getNombre() != null && !comboDetails.getNombre().trim().isEmpty()) {
            combo.setNombre(comboDetails.getNombre().trim());
        }
        if (comboDetails.getPrecio() != null && comboDetails.getPrecio() >= 0) {
            combo.setPrecio(comboDetails.getPrecio());
        }
        if (comboDetails.getPrecioOriginal() != null && comboDetails.getPrecioOriginal() >= 0) {
            combo.setPrecioOriginal(comboDetails.getPrecioOriginal());
        }
        if (comboDetails.getCantidadBoletas() != null && comboDetails.getCantidadBoletas() >= 1) {
            combo.setCantidadBoletas(comboDetails.getCantidadBoletas());
        }
        if (comboDetails.getDescripcion() != null) {
            combo.setDescripcion(comboDetails.getDescripcion());
        }
        if (comboDetails.getActivo() != null) {
            combo.setActivo(comboDetails.getActivo());
        }
        if (comboDetails.getImagenUrl() != null) {
            combo.setImagenUrl(comboDetails.getImagenUrl());
        }
        if (comboDetails.getItemsAdicionales() != null) {
            combo.setItemsAdicionales(comboDetails.getItemsAdicionales());
        }
        if (comboDetails.getEsCumpleanero() != null) {
            combo.setEsCumpleanero(comboDetails.getEsCumpleanero());
        }
        if (comboDetails.getAgotado() != null) {
            combo.setAgotado(comboDetails.getAgotado());
        }

        Combo updatedCombo = comboRepository.save(combo);
        return ResponseEntity.ok(updatedCombo);
    }

    /**
     * Admin endpoint: toggle agotado status.
     */
    @PatchMapping("/api/admin/combos/{id}/toggle-agotado")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> toggleAgotado(@PathVariable Long id) {
        Optional<Combo> comboOpt = comboRepository.findById(id);
        if (comboOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Combo no encontrado."));
        }
        Combo combo = comboOpt.get();
        combo.setAgotado(!combo.getAgotado());
        Combo updated = comboRepository.save(combo);
        return ResponseEntity.ok(updated);
    }

    /**
     * Admin endpoint: delete/deactivate a combo.
     */
    @DeleteMapping("/api/admin/combos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> deleteCombo(@PathVariable Long id) {
        Optional<Combo> comboOpt = comboRepository.findById(id);
        if (comboOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Combo no encontrado."));
        }

        Combo combo = comboOpt.get();
        // Deactivate instead of physical deletion to preserve database integrity and checkout logs
        combo.setActivo(false);
        comboRepository.save(combo);

        return ResponseEntity.ok(new MessageResponse("Combo desactivado correctamente."));
    }
}
