package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.dto.ReporteSeguridadRequest;
import com.dopaminacrew.backend.dto.ReporteSeguridadResponse;
import com.dopaminacrew.backend.dto.TransferenciaLogResponse;
import com.dopaminacrew.backend.service.EmailService;
import com.dopaminacrew.backend.model.ReporteSeguridad;
import com.dopaminacrew.backend.model.TransferenciaLog;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.ReporteSeguridadRepository;
import com.dopaminacrew.backend.repository.TransferenciaLogRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller for Safe Space Live Alerts and Ticket Transfer Audit Logs.
 * Security Note:
 * - Public endpoint /api/public/reportes-seguridad allows sending alerts anonymously.
 * - Admin endpoints are protected by ROLE_ADMIN using Method Security @PreAuthorize.
 */
@RestController
@RequestMapping("/api")
public class ReporteSeguridadController {

    @Autowired
    private ReporteSeguridadRepository reporteSeguridadRepository;

    @Autowired
    private TransferenciaLogRepository transferenciaLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/public/reportes-seguridad")
    public ResponseEntity<?> crearReporte(@Valid @RequestBody ReporteSeguridadRequest request,
                                          @AuthenticationPrincipal UserPrincipal currentUser,
                                          BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(errors);
        }

        ReporteSeguridad reporte = new ReporteSeguridad();
        reporte.setTipo(request.getTipo());
        reporte.setUbicacion(request.getUbicacion());
        reporte.setDescripcion(request.getDescripcion());
        reporte.setEstado("PENDIENTE");

        // If not anonymous and user is logged in, link user
        if ((request.getAnonimo() == null || !request.getAnonimo()) && currentUser != null) {
            Optional<User> userOpt = userRepository.findById(currentUser.getId());
            userOpt.ifPresent(reporte::setUsuario);
        }

        reporteSeguridadRepository.save(reporte);

        emailService.sendSecurityAlert(reporte);

        return ResponseEntity.ok(new MessageResponse("Alerta de seguridad enviada con éxito. El equipo de Dopamina ha sido notificado."));
    }

    @GetMapping("/admin/reportes-seguridad")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> obtenerTodosReportes() {
        List<ReporteSeguridad> reportes = reporteSeguridadRepository.findAllByOrderByCreatedAtDesc();
        List<ReporteSeguridadResponse> response = reportes.stream()
                .map(r -> new ReporteSeguridadResponse(
                        r.getId(),
                        r.getUsuario() != null ? r.getUsuario().getNombre() : "Anónimo",
                        r.getUsuario() != null ? r.getUsuario().getEmail() : "N/A",
                        r.getTipo(),
                        r.getUbicacion(),
                        r.getDescripcion(),
                        r.getEstado(),
                        r.getCreatedAt(),
                        r.getUpdatedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/admin/reportes-seguridad/{id}/resolver")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> resolverReporte(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String nuevoEstado = request.get("estado");
        if (nuevoEstado == null || nuevoEstado.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: El estado es requerido."));
        }

        Optional<ReporteSeguridad> reporteOpt = reporteSeguridadRepository.findById(id);
        if (reporteOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Reporte no encontrado."));
        }

        ReporteSeguridad reporte = reporteOpt.get();
        if (!"PENDIENTE".equalsIgnoreCase(nuevoEstado) && !"EN_PROCESO".equalsIgnoreCase(nuevoEstado) && !"RESUELTO".equalsIgnoreCase(nuevoEstado)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Estado no válido."));
        }

        reporte.setEstado(nuevoEstado.toUpperCase());
        reporteSeguridadRepository.save(reporte);

        return ResponseEntity.ok(new MessageResponse("Estado del reporte actualizado a " + nuevoEstado.toUpperCase() + "."));
    }

    @GetMapping("/admin/transferencias")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> obtenerTransferencias() {
        List<TransferenciaLog> logs = transferenciaLogRepository.findAllByOrderByFechaTransferenciaDesc();
        List<TransferenciaLogResponse> response = logs.stream()
                .map(l -> new TransferenciaLogResponse(
                        l.getId(),
                        l.getBoleta().getId(),
                        l.getBoleta().getCompra().getEvento() != null ? l.getBoleta().getCompra().getEvento().getNombre() : "N/A",
                        l.getUsuarioOrigen().getNombre(),
                        l.getUsuarioOrigen().getEmail(),
                        l.getUsuarioDestino().getNombre(),
                        l.getUsuarioDestino().getEmail(),
                        l.getCodigoQrAnterior(),
                        l.getCodigoQrNuevo(),
                        l.getFechaTransferencia()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
