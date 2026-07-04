package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.model.RoleName;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for managing campaigns and promoter incentives.
 */
@RestController
@RequestMapping("/api")
public class CampanasController {

    private static final String CHALLENGE_FILE = "active_challenge.txt";

    private final UserRepository userRepository;
    private final EmailService emailService;

    public CampanasController(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public static class CampanaRequest {
        public String subject;
        public String message;
        public String target; // "CLIENTES" or "PROMOTORES"
    }

    public static class RetoRequest {
        public String message;
    }

    /**
     * Send email campaign to either all customers (ROLE_USER) or promoters (ROLE_PROMOTER).
     */
    @PostMapping("/admin/campanas/enviar")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> enviarCampana(@RequestBody CampanaRequest request) {
        if (request.subject == null || request.subject.isBlank() ||
            request.message == null || request.message.isBlank() ||
            request.target == null || request.target.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Asunto, mensaje y destinatario son obligatorios."));
        }

        List<User> allUsers = userRepository.findAll();
        List<User> targets;

        if ("PROMOTORES".equalsIgnoreCase(request.target)) {
            targets = allUsers.stream()
                    .filter(u -> u.getRol() != null && u.getRol().getNombre() == RoleName.ROLE_PROMOTER && !Boolean.TRUE.equals(u.getBanned()))
                    .collect(Collectors.toList());
        } else {
            targets = allUsers.stream()
                    .filter(u -> u.getRol() != null && u.getRol().getNombre() == RoleName.ROLE_USER && !Boolean.TRUE.equals(u.getBanned()))
                    .collect(Collectors.toList());
        }

        if (targets.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No se encontraron usuarios en la lista de destinatarios."));
        }

        // Send emails in a background thread to prevent endpoint blocking
        new Thread(() -> {
            for (User u : targets) {
                try {
                    emailService.sendManualCustomEmail(u.getEmail(), request.subject, request.message);
                    Thread.sleep(100); // 100ms throttle to prevent mail server saturation
                } catch (Exception e) {
                    System.err.println("Error enviando correo de campaña a " + u.getEmail() + ": " + e.getMessage());
                }
            }
        }).start();

        return ResponseEntity.ok(Map.of(
            "message", "Campaña iniciada con éxito. Enviando a " + targets.size() + " destinatarios en segundo plano."
        ));
    }

    /**
     * Update active challenge/incentive message for promoters.
     */
    @PostMapping("/admin/campanas/reto")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> actualizarReto(@RequestBody RetoRequest request) {
        String msg = request.message != null ? request.message.trim() : "";
        try {
            Path path = Paths.get(CHALLENGE_FILE);
            Files.writeString(path, msg);
            return ResponseEntity.ok(Map.of("message", "Reto de promotores actualizado con éxito."));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error al guardar el reto: " + e.getMessage()));
        }
    }

    /**
     * Get active challenge/incentive for promoters.
     * Can be accessed by admin or promoter.
     */
    @GetMapping("/promotor/reto-activo")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN', 'ROLE_PROMOTER', 'PROMOTER')")
    public ResponseEntity<?> obtenerRetoActivo() {
        try {
            Path path = Paths.get(CHALLENGE_FILE);
            if (Files.exists(path)) {
                String msg = Files.readString(path).trim();
                return ResponseEntity.ok(Map.of("message", msg));
            }
        } catch (IOException e) {
            System.err.println("Error al leer el archivo de retos: " + e.getMessage());
        }
        return ResponseEntity.ok(Map.of("message", ""));
    }
}
