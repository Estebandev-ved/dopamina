package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.BoletaResponse;
import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.dto.RegaloBoletaRequest;
import com.dopaminacrew.backend.model.*;
import com.dopaminacrew.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for Admin Ticket (Boleta) operations, including door QR code validation.
 * Security Note:
 * - Only accessible by users with ROLE_ADMIN.
 * - Utilizes Database Transactions to avoid concurrency/double-scan check-in race conditions.
 */
@RestController
@RequestMapping("/api/admin/boletas")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBoletaController {

    @Autowired
    private BoletaRepository boletaRepository;

    @Autowired
    private RegistroAccesoRepository registroAccesoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/regalar")
    @Transactional
    public ResponseEntity<?> regalarBoletas(@Valid @RequestBody RegaloBoletaRequest request) {
        Evento evento = eventoRepository.findById(request.getEventoId())
                .orElseThrow(() -> new RuntimeException("Error: Evento no encontrado."));

        // Check if user exists by email
        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;

        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            // Create a new user if they don't exist
            user = new User();
            user.setNombre(request.getNombre().trim());
            user.setEmail(email);
            user.setTelefono(request.getTelefono() != null ? request.getTelefono().trim() : "3000000000");
            
            // Random password BCrypt encrypted
            String rawPassword = UUID.randomUUID().toString().substring(0, 12);
            user.setPassword(passwordEncoder.encode(rawPassword));
            
            // Get USER role
            Role userRole = roleRepository.findByNombre(RoleName.ROLE_USER)
                    .orElseGet(() -> roleRepository.save(new Role(null, RoleName.ROLE_USER)));
            user.setRol(userRole);
            user.setBanned(false);
            
            user = userRepository.save(user);
        }

        // Check capacity (entradas pagadas + pendientes con reserva vigente)
        int cantidad = request.getCantidad();
        int sold = compraRepository.contarEntradasOcupadas(evento.getId());
        if (sold + cantidad > 1000) {
            int cuposRestantes = 1000 - sold;
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Aforo completo. Solo quedan " 
                    + (cuposRestantes > 0 ? cuposRestantes : 0) + " entradas disponibles."));
        }

        // Create free purchase record
        Compra compra = new Compra();
        compra.setUsuario(user);
        compra.setEvento(evento);
        compra.setCantidad(cantidad);
        compra.setSubtotal(0.0);
        compra.setDescuento(0.0);
        compra.setTotal(0.0);
        compra.setCodigoCupon(request.getNota() != null && !request.getNota().trim().isEmpty() ? request.getNota().trim() : "CORTESIA");
        compra.setEstado("REGALADA");

        String purchaseRef = "DOPAMINA-GIFT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis();
        compra.setCodigoQr(purchaseRef);

        Compra savedCompra = compraRepository.save(compra);

        int nextSorteo = 1;
        if (savedCompra.getEvento() != null) {
            Integer maxSorteo = boletaRepository.findMaxNumeroSorteoByEventoId(savedCompra.getEvento().getId());
            nextSorteo = (maxSorteo != null ? maxSorteo : 0) + 1;
        }

        // Generate tickets
        for (int i = 0; i < cantidad; i++) {
            Boleta boleta = new Boleta();
            boleta.setCompra(savedCompra);
            boleta.setUsuario(user);
            String ticketRef = "DOPAMINA-GIFT-QR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() + "-" + (i + 1);
            boleta.setCodigoQr(ticketRef);
            boleta.setEstado("ACTIVA");
            boleta.setNumeroSorteo(nextSorteo++);
            boletaRepository.save(boleta);
        }

        return ResponseEntity.ok(new MessageResponse("¡Boletas de cortesía creadas con éxito para " + user.getNombre() + "!"));
    }

    @PostMapping("/validar-qr")
    @Transactional
    public ResponseEntity<?> validarQr(@RequestBody Map<String, String> request) {
        String codigoQr = request.get("codigoQr");
        if (codigoQr == null || codigoQr.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: El código QR no puede estar vacío."));
        }

        String qr = codigoQr.trim();
        Optional<Boleta> boletaOpt = boletaRepository.findByCodigoQr(qr);
        if (boletaOpt.isEmpty()) {
            // Guardar registro de denegación por código inválido
            RegistroAcceso log = new RegistroAcceso(null, qr, "Desconocido", "Desconocido", "DENIED", "Código QR inválido / no existe en el sistema.", null);
            registroAccesoRepository.save(log);
            return ResponseEntity.status(404).body(new MessageResponse("Error: Boleta no encontrada. El código QR no es válido."));
        }

        Boleta boleta = boletaOpt.get();
        
        // Mapear nombres del usuario y evento para el registro
        String evNombre = "Evento";
        String usuarioNombre = "Desconocido";
        Compra compraAux = boleta.getCompra();
        if (boleta.getUsuario() != null) {
            usuarioNombre = boleta.getUsuario().getNombre();
        } else if (compraAux != null && compraAux.getUsuario() != null) {
            usuarioNombre = compraAux.getUsuario().getNombre();
        }
        if (compraAux != null && compraAux.getEvento() != null) {
            evNombre = compraAux.getEvento().getNombre();
        }

        if ("USADA".equalsIgnoreCase(boleta.getEstado())) {
            String detailMsg = "Error: Acceso Denegado. La boleta de " 
                    + usuarioNombre 
                    + " para el evento '" + evNombre 
                    + "' ya fue utilizada anteriormente.";
            
            // Guardar registro de denegación por boleta duplicada/usada
            RegistroAcceso log = new RegistroAcceso(null, qr, usuarioNombre, evNombre, "DENIED", "La boleta ya fue utilizada anteriormente.", null);
            registroAccesoRepository.save(log);

            return ResponseEntity.badRequest().body(new MessageResponse(detailMsg));
        }

        // Mark as USED
        boleta.setEstado("USADA");
        Boleta savedBoleta = boletaRepository.save(boleta);

        // Guardar registro de acceso exitoso
        RegistroAcceso log = new RegistroAcceso(null, qr, usuarioNombre, evNombre, "SUCCESS", "¡ACCESO PERMITIDO!", null);
        registroAccesoRepository.save(log);

        return ResponseEntity.ok(mapToBoletaResponse(savedBoleta));
    }

    @GetMapping("/sorteo")
    @Transactional(readOnly = true)
    public ResponseEntity<?> buscarBoletaPorNumeroSorteo(@RequestParam("eventoId") Long eventoId, @RequestParam("numeroSorteo") Integer numeroSorteo) {
        Optional<Boleta> boletaOpt = boletaRepository.findByEventoIdAndNumeroSorteo(eventoId, numeroSorteo);
        if (boletaOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("No se encontró ninguna boleta con el número de sorteo " + numeroSorteo + " para este evento."));
        }
        Boleta boleta = boletaOpt.get();
        return ResponseEntity.ok(mapToBoletaResponse(boleta));
    }

    @GetMapping("/sorteo/participantes")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getBoletasParticipantes(@RequestParam("eventoId") Long eventoId) {
        List<Boleta> boletas = boletaRepository.findBoletasParticipantesByEventoId(eventoId);
        List<BoletaResponse> response = boletas.stream()
                .map(this::mapToBoletaResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    private BoletaResponse mapToBoletaResponse(Boleta boleta) {
        String evNombre = null;
        String evFecha = null;
        String evHora = null;
        String evLugar = null;
        String evCiudad = null;
        String usuarioNombre = null;

        Compra compra = boleta.getCompra();
        if (boleta.getUsuario() != null) {
            usuarioNombre = boleta.getUsuario().getNombre();
        } else if (compra != null && compra.getUsuario() != null) {
            usuarioNombre = compra.getUsuario().getNombre();
        }

        if (compra != null) {
            if (compra.getEvento() != null) {
                evNombre = compra.getEvento().getNombre();
                evFecha = compra.getEvento().getFecha() != null ? compra.getEvento().getFecha().toString() : null;
                evHora = compra.getEvento().getHora() != null ? compra.getEvento().getHora().toString() : null;
                evLugar = compra.getEvento().getLugar();
                evCiudad = compra.getEvento().getCiudad();
            }
        }

        java.time.LocalDateTime ticketDate = boleta.getCreatedAt();
        if (ticketDate == null && compra != null) {
            ticketDate = compra.getCreatedAt();
        }
        if (ticketDate == null) {
            ticketDate = java.time.LocalDateTime.now();
        }

        String comboNombre = null;
        String comboItems = null;
        Boolean requiereVerificacionCumple = false;
        if (compra != null) {
            comboNombre = compra.getComboNombre();
            comboItems = compra.getComboItems();
            requiereVerificacionCumple = compra.getRequiereVerificacionCumple() != null ? compra.getRequiereVerificacionCumple() : false;
        }

        return new BoletaResponse(
                boleta.getId(),
                evNombre,
                evFecha,
                evHora,
                evLugar,
                evCiudad,
                boleta.getCodigoQr(),
                boleta.getEstado(),
                ticketDate,
                usuarioNombre,
                boleta.getNumeroSorteo(),
                comboNombre,
                comboItems,
                requiereVerificacionCumple
        );
    }

    @GetMapping("/logs-acceso")
    public ResponseEntity<?> getLogsAcceso() {
        List<RegistroAcceso> logs = registroAccesoRepository.findTop50ByOrderByCreatedAtDesc();
        return ResponseEntity.ok(logs);
    }

    @DeleteMapping("/logs-acceso")
    @Transactional
    public ResponseEntity<?> clearLogsAcceso() {
        registroAccesoRepository.deleteAllInBatch();
        return ResponseEntity.ok(new MessageResponse("Registro de accesos borrado con éxito de la base de datos."));
    }
}

