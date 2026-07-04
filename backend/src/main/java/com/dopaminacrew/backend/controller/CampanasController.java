package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.model.RoleName;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.PromotorBono;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.repository.CompraRepository;
import com.dopaminacrew.backend.repository.CuponRepository;
import com.dopaminacrew.backend.repository.PromotorBonoRepository;
import com.dopaminacrew.backend.service.EmailService;
import com.dopaminacrew.backend.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    private static final String CHALLENGE_FILE = "active_challenge.json";

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final CompraRepository compraRepository;
    private final CuponRepository cuponRepository;
    private final PromotorBonoRepository promotorBonoRepository;

    public CampanasController(UserRepository userRepository, 
                              EmailService emailService,
                              CompraRepository compraRepository,
                              CuponRepository cuponRepository,
                              PromotorBonoRepository promotorBonoRepository) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.compraRepository = compraRepository;
        this.cuponRepository = cuponRepository;
        this.promotorBonoRepository = promotorBonoRepository;
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
        
        // Validar que sea un JSON válido (si no está vacío)
        if (!msg.isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                mapper.readTree(msg);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "El formato del reto debe ser un JSON válido."));
            }
        }
        
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
    public ResponseEntity<?> obtenerRetoActivo(@AuthenticationPrincipal UserPrincipal currentUser) {
        Map<String, Object> response = new HashMap<>();
        
        String jsonContent = "";
        try {
            Path path = Paths.get(CHALLENGE_FILE);
            if (Files.exists(path)) {
                jsonContent = Files.readString(path).trim();
            }
        } catch (IOException e) {
            System.err.println("Error al leer el archivo de retos: " + e.getMessage());
        }
        
        response.put("challengeJson", jsonContent);

        // Si es promotor, calculamos su progreso de hoy
        if (currentUser != null && currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PROMOTER"))) {
            Long promotorId = currentUser.getId();
            LocalDate hoy = LocalDate.now();
            LocalDateTime inicioDia = hoy.atStartOfDay();
            LocalDateTime finDia = hoy.atTime(LocalTime.MAX);

            List<com.dopaminacrew.backend.model.Cupon> cupones = cuponRepository.findByPromotorId(promotorId);
            long progresoHoy = 0;
            if (!cupones.isEmpty()) {
                List<String> codigos = cupones.stream().map(com.dopaminacrew.backend.model.Cupon::getCodigo).collect(Collectors.toList());
                List<Compra> compras = compraRepository.findUsagesByCodigoCuponIn(codigos);
                progresoHoy = compras.stream()
                        .filter(c -> ("PAGADO".equals(c.getEstado()) || "REGALADA".equals(c.getEstado()))
                                && c.getCreatedAt() != null
                                && c.getCreatedAt().isAfter(inicioDia)
                                && c.getCreatedAt().isBefore(finDia))
                        .mapToInt(c -> c.getCantidad() != null ? c.getCantidad() : 0)
                        .sum();
            }
            response.put("progresoHoy", progresoHoy);

            // Obtener los bonos ya ganados/registrados hoy para este promotor
            List<PromotorBono> bonosHoy = promotorBonoRepository.findByPromotorIdAndFecha(promotorId, hoy);
            response.put("bonosGanadosHoy", bonosHoy);
        }

        return ResponseEntity.ok(response);
    }
}
