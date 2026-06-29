package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Cupon;
import com.dopaminacrew.backend.repository.CuponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * PublicCuponController — REST endpoints for public coupon validations.
 */
@RestController
@RequestMapping("/api/public/cupones")
public class PublicCuponController {

    @Autowired
    private CuponRepository cuponRepository;

    /** Validates if a coupon exists and is active, returning its discount. */
    @GetMapping("/validar")
    public ResponseEntity<?> validarCupon(@RequestParam("codigo") String codigo) {
        if (codigo == null || codigo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Código de cupón vacío."));
        }

        Optional<Cupon> cuponOpt = cuponRepository.findByCodigoIgnoreCase(codigo.trim());
        if (cuponOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("El cupón ingresado no existe."));
        }

        Cupon cupon = cuponOpt.get();
        if (!cupon.getActivo()) {
            return ResponseEntity.badRequest().body(new MessageResponse("El cupón ingresado no está activo o ya venció."));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("codigo", cupon.getCodigo().toUpperCase());
        response.put("descuentoPorcentaje", cupon.getDescuentoPorcentaje());
        response.put("descripcion", cupon.getDescripcion());
        response.put("valido", true);

        return ResponseEntity.ok(response);
    }
}
