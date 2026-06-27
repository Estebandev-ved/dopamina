package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.CanjeRequest;
import com.dopaminacrew.backend.dto.CanjeResponse;
import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Canje;
import com.dopaminacrew.backend.security.UserPrincipal;
import com.dopaminacrew.backend.service.CanjeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for reward redemptions.
 * Security Note:
 * - Endpoints under /api/canjes require general authentication (validated via JWT).
 * - Endpoints under /api/admin/canjes require explicitly ROLE_ADMIN role check.
 * - Input validation using @Valid prevents request-tampering or bad properties storage.
 */
@RestController
@RequestMapping("/api")
public class CanjeController {

    @Autowired
    private CanjeService canjeService;

    /**
     * Redeems a loyalty reward for the current logged-in user.
     * Security: Authenticated only. Points are dynamically validated in backend service.
     */
    @PostMapping("/canjes/reclamar")
    public ResponseEntity<?> reclamarPremio(@Valid @RequestBody CanjeRequest request,
                                            @AuthenticationPrincipal UserPrincipal currentUser,
                                            BindingResult bindingResult) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("No autorizado. Inicie sesión."));
        }

        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(errors);
        }

        try {
            Canje canje = canjeService.registrarCanje(
                    currentUser.getId(),
                    request.getPremioId(),
                    request.getPremioTitulo(),
                    request.getCostoPuntos()
            );
            return ResponseEntity.ok(mapToResponse(canje));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }

    /**
     * Returns the available points balance for the current user.
     * Security: Authenticated only.
     */
    @GetMapping("/canjes/puntos")
    public ResponseEntity<?> getPuntosDisponibles(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("No autorizado. Inicie sesión."));
        }
        int puntos = canjeService.getPuntosDisponibles(currentUser.getId());
        Map<String, Integer> response = new HashMap<>();
        response.put("puntos", puntos);
        return ResponseEntity.ok(response);
    }

    /**
     * Returns the list of reward redemptions for the current user.
     * Security: Authenticated only.
     */
    @GetMapping("/canjes/mis-canjes")
    public ResponseEntity<?> getMisCanjes(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("No autorizado. Inicie sesión."));
        }
        List<Canje> canjes = canjeService.getCanjesUsuario(currentUser.getId());
        List<CanjeResponse> response = canjes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Returns all reward redemptions in the database.
     * Security: Admin-only role check.
     */
    @GetMapping("/admin/canjes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CanjeResponse>> getTodosCanjes() {
        List<Canje> canjes = canjeService.getTodosCanjes();
        List<CanjeResponse> response = canjes.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Updates the status of a redemption (e.g. from PENDIENTE to ENTREGADO).
     * Security: Admin-only role check. Validates the incoming status.
     */
    @PutMapping("/admin/canjes/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> actualizarEstadoCanje(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body) {
        String estado = body.get("estado");
        if (estado == null || estado.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("El estado no puede estar vacío."));
        }

        try {
            Canje canje = canjeService.actualizarEstadoCanje(id, estado);
            return ResponseEntity.ok(mapToResponse(canje));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }

    private CanjeResponse mapToResponse(Canje canje) {
        return new CanjeResponse(
                canje.getId(),
                canje.getUsuario() != null ? canje.getUsuario().getNombre() : "N/A",
                canje.getUsuario() != null ? canje.getUsuario().getEmail() : "N/A",
                canje.getPremioId(),
                canje.getPremioTitulo(),
                canje.getCodigoCanje(),
                canje.getCostoPuntos(),
                canje.getEstado(),
                canje.getCreatedAt() != null ? canje.getCreatedAt().toString() : null
        );
    }
}
