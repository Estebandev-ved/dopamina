package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Cupon;
import com.dopaminacrew.backend.repository.CuponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * AdminCuponController — REST endpoints for admin coupon management (cuponera).
 */
@RestController
@RequestMapping("/api/admin/cupones")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCuponController {

    @Autowired
    private CuponRepository cuponRepository;

    /** Lists all coupons sorted by creation date. */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Cupon>> listarCupones() {
        return ResponseEntity.ok(cuponRepository.findAll());
    }

    /** Creates a new coupon. */
    @PostMapping
    @Transactional
    public ResponseEntity<?> crearCupon(@RequestBody Cupon nuevoCupon) {
        if (nuevoCupon.getCodigo() == null || nuevoCupon.getCodigo().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: El código de cupón es requerido."));
        }
        if (nuevoCupon.getDescuentoPorcentaje() == null || nuevoCupon.getDescuentoPorcentaje() <= 0 || nuevoCupon.getDescuentoPorcentaje() > 100) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: El porcentaje de descuento debe estar entre 0.1 y 100."));
        }

        String codigoNormalized = nuevoCupon.getCodigo().trim().toUpperCase();
        Optional<Cupon> existing = cuponRepository.findByCodigoIgnoreCase(codigoNormalized);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Ya existe un cupón con el código '" + codigoNormalized + "'."));
        }

        nuevoCupon.setCodigo(codigoNormalized);
        nuevoCupon.setActivo(nuevoCupon.getActivo() != null ? nuevoCupon.getActivo() : true);
        Cupon saved = cuponRepository.save(nuevoCupon);
        return ResponseEntity.ok(saved);
    }

    /** Toggles the active status of a coupon. */
    @PutMapping("/{id}/toggle")
    @Transactional
    public ResponseEntity<?> toggleCuponStatus(@PathVariable("id") Long id) {
        Optional<Cupon> cuponOpt = cuponRepository.findById(id);
        if (cuponOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Cupón no encontrado."));
        }

        Cupon cupon = cuponOpt.get();
        cupon.setActivo(!cupon.getActivo());
        Cupon saved = cuponRepository.save(cupon);
        return ResponseEntity.ok(saved);
    }

    /** Deletes a coupon. */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> eliminarCupon(@PathVariable("id") Long id) {
        Optional<Cupon> cuponOpt = cuponRepository.findById(id);
        if (cuponOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Cupón no encontrado."));
        }

        cuponRepository.delete(cuponOpt.get());
        return ResponseEntity.ok(new MessageResponse("Cupón eliminado exitosamente."));
    }
}
