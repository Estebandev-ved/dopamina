package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.CheckoutRequest;
import com.dopaminacrew.backend.dto.CompraResponse;
import com.dopaminacrew.backend.dto.BoletaResponse;
import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.Boleta;
import com.dopaminacrew.backend.repository.BoletaRepository;
import com.dopaminacrew.backend.security.UserPrincipal;
import com.dopaminacrew.backend.service.CompraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
 * Controller for ticket purchases and bookings.
 * Security Note:
 * - Requires authorization (checked by JwtAuthenticationFilter).
 * - Exposes data through clean DTOs to hide internal user DB mappings.
 */
@RestController
@RequestMapping("/api/compras")
public class CompraController {

    @Autowired
    private CompraService compraService;

    @Autowired
    private BoletaRepository boletaRepository;

    @Autowired
    private com.dopaminacrew.backend.repository.UserRepository userRepository;

    @Autowired
    private com.dopaminacrew.backend.repository.TransferenciaLogRepository transferenciaLogRepository;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@Valid @RequestBody CheckoutRequest checkoutRequest, 
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
            Compra compra = compraService.processCheckout(checkoutRequest, currentUser.getId());
            CompraResponse response = mapToResponse(compra);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        }
    }

    @GetMapping("/promo-parche")
    public ResponseEntity<?> getPromoParcheDisponible(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("No autorizado. Inicie sesión."));
        }
        Map<String, Boolean> response = new HashMap<>();
        response.put("disponible", compraService.isPromoParcheDisponible(currentUser.getId()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mis-boletas")
    @Transactional
    public ResponseEntity<?> getMisBoletas(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("No autorizado. Inicie sesión."));
        }

        // Fetch all purchases for this user
        List<Compra> compras = compraService.getMisBoletas(currentUser.getId());
        
        // Ensure every purchased ticket is backed by an individual Boleta entity.
        // IMPORTANTE: solo se generan QR de compras realmente PAGADAS. Una compra
        // PENDIENTE (pago no completado o abandonado en la pasarela) NO debe generar
        // boletas ni QR.
        for (Compra compra : compras) {
            if (!"PAGADO".equals(compra.getEstado()) && !"REGALADA".equals(compra.getEstado())) {
                continue;
            }
            int expectedCount = compra.getCantidad() != null ? compra.getCantidad() : 0;
            long existingCount = boletaRepository.countByCompraId(compra.getId());
            if (existingCount < expectedCount) {
                int nextSorteo = 1;
                if (compra.getEvento() != null) {
                    Integer maxSorteo = boletaRepository.findMaxNumeroSorteoByEventoId(compra.getEvento().getId());
                    nextSorteo = (maxSorteo != null ? maxSorteo : 0) + 1;
                }
                for (int i = (int) existingCount; i < expectedCount; i++) {
                    Boleta boleta = new Boleta();
                    boleta.setCompra(compra);
                    String ticketRef = "DOPAMINA-QR-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() + "-" + (i + 1);
                    boleta.setCodigoQr(ticketRef);
                    boleta.setEstado("ACTIVA");
                    boleta.setNumeroSorteo(nextSorteo++);
                    boletaRepository.save(boleta);
                }
            }
        }

        // Solo se muestran QR de compras PAGADAS (defensa también contra boletas que
        // hayan podido quedar de compras pendientes anteriores a este arreglo).
        List<Boleta> boletas = boletaRepository.findByUsuarioIdOrderByCreatedAtDesc(currentUser.getId());
        List<BoletaResponse> response = boletas.stream()
                .filter(b -> b.getCompra() != null && ("PAGADO".equals(b.getCompra().getEstado()) || "REGALADA".equals(b.getCompra().getEstado())))
                .map(this::mapToBoletaResponse)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transferir")
    @Transactional
    public ResponseEntity<?> transferirBoleta(@Valid @RequestBody com.dopaminacrew.backend.dto.TransferenciaRequest request,
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

        Optional<Boleta> boletaOpt = boletaRepository.findById(request.getBoletaId());
        if (boletaOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Boleta no encontrada."));
        }

        Boleta boleta = boletaOpt.get();

        Long ownerId = boleta.getUsuario() != null ? boleta.getUsuario().getId() : boleta.getCompra().getUsuario().getId();
        if (!ownerId.equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: No tienes permisos sobre esta boleta."));
        }

        if (!"ACTIVA".equalsIgnoreCase(boleta.getEstado())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Solo se pueden transferir boletas en estado ACTIVA."));
        }

        Optional<com.dopaminacrew.backend.model.User> destUserOpt = userRepository.findByEmail(request.getEmailDestino().trim());
        if (destUserOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: El usuario destinatario (" + request.getEmailDestino() + ") no está registrado."));
        }

        com.dopaminacrew.backend.model.User destUser = destUserOpt.get();

        if (destUser.getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: No puedes transferir una boleta a ti mismo."));
        }

        Optional<com.dopaminacrew.backend.model.User> senderUserOpt = userRepository.findById(currentUser.getId());
        if (senderUserOpt.isEmpty()) {
            return ResponseEntity.status(500).body(new MessageResponse("Error: Remitente no encontrado en base de datos."));
        }
        com.dopaminacrew.backend.model.User senderUser = senderUserOpt.get();

        String previousQr = boleta.getCodigoQr();
        String newQr = "DOPAMINA-QR-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() + "-TRANS";
        
        boleta.setUsuario(destUser);
        boleta.setCodigoQr(newQr);
        boletaRepository.save(boleta);

        com.dopaminacrew.backend.model.TransferenciaLog log = new com.dopaminacrew.backend.model.TransferenciaLog();
        log.setBoleta(boleta);
        log.setUsuarioOrigen(senderUser);
        log.setUsuarioDestino(destUser);
        log.setCodigoQrAnterior(previousQr);
        log.setCodigoQrNuevo(newQr);
        transferenciaLogRepository.save(log);

        return ResponseEntity.ok(new MessageResponse("Boleta transferida con éxito a " + destUser.getNombre() + "."));
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

        java.time.LocalDateTime purchaseDate = boleta.getCreatedAt();
        if (purchaseDate == null && compra != null) {
            purchaseDate = compra.getCreatedAt();
        }
        if (purchaseDate == null) {
            purchaseDate = java.time.LocalDateTime.now();
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
                purchaseDate,
                usuarioNombre,
                boleta.getNumeroSorteo()
        );
    }

    private CompraResponse mapToResponse(Compra compra) {
        String evNombre = null;
        String evFecha = null;
        String evHora = null;
        String evLugar = null;
        String evCiudad = null;

        if (compra.getEvento() != null) {
            evNombre = compra.getEvento().getNombre();
            evFecha = compra.getEvento().getFecha() != null ? compra.getEvento().getFecha().toString() : null;
            evHora = compra.getEvento().getHora() != null ? compra.getEvento().getHora().toString() : null;
            evLugar = compra.getEvento().getLugar();
            evCiudad = compra.getEvento().getCiudad();
        }

        return new CompraResponse(
                compra.getId(),
                compra.getCantidad(),
                compra.getSubtotal(),
                compra.getDescuento(),
                compra.getTotal(),
                compra.getCodigoCupon(),
                compra.getEstado(),
                compra.getCodigoQr(),
                compra.getCreatedAt(),
                evNombre,
                evFecha,
                evHora,
                evLugar,
                evCiudad
        );
    }
}
