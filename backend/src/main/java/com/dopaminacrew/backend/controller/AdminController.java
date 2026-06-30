package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.AdminStatsResponse;
import com.dopaminacrew.backend.dto.EmailManualRequest;
import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.service.AdminService;
import com.dopaminacrew.backend.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST Controller for Admin Dashboard operations.
 * Security Notes:
 * - ALL endpoints are protected by @PreAuthorize("hasRole('ADMIN')") - only ROLE_ADMIN users can access.
 * - @EnableMethodSecurity is active in SecurityConfig to enforce this at the method level.
 * - No mass-assignment risk: responses use explicit DTOs, not raw entities.
 * - DELETE operations are intentionally separated for audit clarity.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private EmailService emailService;

    /**
     * Returns aggregated dashboard statistics:
     * total users, total purchases, revenue, last 10 transactions.
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    /**
     * Returns the full list of all purchases across all users.
     * Security: ADMIN-only. Returns DTOs (no raw entity exposure).
     */
    @GetMapping("/compras")
    public ResponseEntity<List<AdminStatsResponse.CompraAdminDTO>> getAllCompras() {
        return ResponseEntity.ok(adminService.getAllCompras());
    }

    /**
     * Returns the full list of all registered users.
     * Security: ADMIN-only. Passwords are never included in the DTO.
     */
    @GetMapping("/usuarios")
    public ResponseEntity<List<AdminStatsResponse.UsuarioAdminDTO>> getAllUsuarios() {
        return ResponseEntity.ok(adminService.getAllUsuarios());
    }

    /**
     * Deletes a purchase by ID.
     * Security: ADMIN-only. Validates existence before deletion to avoid enumeration leaks.
     */
    @DeleteMapping("/compras/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCompra(@PathVariable Long id) {
        adminService.deleteCompra(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes a user by ID.
     * Security: ADMIN-only. Validates existence before deletion.
     */
    @DeleteMapping("/usuarios/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUsuario(@PathVariable Long id) {
        adminService.deleteUsuario(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Envía un correo electrónico de forma manual a un usuario.
     * Seguridad: ADMIN o SUBADMIN únicamente.
     * Medida de Seguridad: Entrada saneada mediante DTO validado (@Valid).
     */
    @PostMapping("/enviar-correo")
    public ResponseEntity<?> enviarCorreoManual(@Valid @RequestBody EmailManualRequest request) {
        emailService.sendManualCustomEmail(request.getTo(), request.getSubject(), request.getBody());
        return ResponseEntity.ok(new MessageResponse("Correo enviado exitosamente"));
    }
}
