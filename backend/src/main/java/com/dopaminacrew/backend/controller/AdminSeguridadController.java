package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.LoginAudit;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.model.Role;
import com.dopaminacrew.backend.model.RoleName;
import com.dopaminacrew.backend.repository.LoginAuditRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.repository.RoleRepository;
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

    @Autowired
    private RoleRepository roleRepository;

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

    /**
     * Actualiza el rol de un usuario.
     * Solo accesible por el administrador principal (ROLE_ADMIN).
     */
    @PutMapping("/usuarios/{id}/rol")
    @Transactional
    public ResponseEntity<?> cambiarRolUsuario(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        String nuevoRolStr = body.get("rol");
        if (nuevoRolStr == null || nuevoRolStr.isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("El rol es obligatorio."));
        }

        RoleName roleName;
        try {
            roleName = RoleName.valueOf(nuevoRolStr.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse("El rol especificado no es válido. Roles válidos: ROLE_USER, ROLE_ADMIN, ROLE_SUBADMIN"));
        }

        Role role = roleRepository.findByNombre(roleName)
                .orElseGet(() -> roleRepository.save(new Role(null, roleName)));

        user.setRol(role);
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Rol de usuario actualizado exitosamente a " + roleName.name() + "."));
    }
}
