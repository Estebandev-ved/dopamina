package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.BoletaResponse;
import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Boleta;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.RegistroAcceso;
import com.dopaminacrew.backend.repository.BoletaRepository;
import com.dopaminacrew.backend.repository.RegistroAccesoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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

        // Map details for successful validation response
        String evFecha = null;
        String evHora = null;
        String evLugar = null;
        String evCiudad = null;

        Compra compra = savedBoleta.getCompra();
        if (compra != null) {
            if (compra.getEvento() != null) {
                evFecha = compra.getEvento().getFecha() != null ? compra.getEvento().getFecha().toString() : null;
                evHora = compra.getEvento().getHora() != null ? compra.getEvento().getHora().toString() : null;
                evLugar = compra.getEvento().getLugar();
                evCiudad = compra.getEvento().getCiudad();
            }
        }

        // Guardar registro de acceso exitoso
        RegistroAcceso log = new RegistroAcceso(null, qr, usuarioNombre, evNombre, "SUCCESS", "¡ACCESO PERMITIDO!", null);
        registroAccesoRepository.save(log);

        BoletaResponse response = new BoletaResponse(
                savedBoleta.getId(),
                evNombre,
                evFecha,
                evHora,
                evLugar,
                evCiudad,
                savedBoleta.getCodigoQr(),
                savedBoleta.getEstado(),
                savedBoleta.getCreatedAt(),
                usuarioNombre
        );

        return ResponseEntity.ok(response);
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

