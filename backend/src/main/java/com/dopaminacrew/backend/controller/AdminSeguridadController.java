package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.LoginAudit;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.LoginAuditRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Controller for cybersecurity administrative operations (audits & lockout/banning).
 * Security Notes:
 * - Restricted to ROLE_ADMIN via class-level @PreAuthorize.
 * - Transactions are used for atomic database state changes.
 */
@RestController
@RequestMapping("/api/admin/seguridad")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSeguridadController {

    @Autowired
    private LoginAuditRepository loginAuditRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all login audits in chronological order (newest first).
     */
    @GetMapping("/logs")
    public ResponseEntity<List<LoginAudit>> getLoginLogs() {
        return ResponseEntity.ok(loginAuditRepository.findAllByOrderByTimestampDesc());
    }

    /**
     * Ban/Suspend a user by ID.
     */
    @PutMapping("/usuarios/{id}/ban")
    @Transactional
    public ResponseEntity<?> banUsuario(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        
        if (user.getRol() != null && "ROLE_ADMIN".equals(user.getRol().getNombre().name())) {
            return ResponseEntity.badRequest().body(new MessageResponse("No se puede suspender a un administrador."));
        }

        user.setBanned(true);
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Usuario suspendido exitosamente."));
    }

    /**
     * Lift suspension/Unban a user by ID.
     */
    @PutMapping("/usuarios/{id}/unban")
    @Transactional
    public ResponseEntity<?> unbanUsuario(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        user.setBanned(false);
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Suspensión levantada exitosamente."));
    }
}
