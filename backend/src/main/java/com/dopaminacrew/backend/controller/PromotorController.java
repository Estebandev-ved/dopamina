package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.Cupon;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.CompraRepository;
import com.dopaminacrew.backend.repository.CuponRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * PromotorController — REST endpoints for promoters to check their coupon usage and earnings.
 * Security Note: Endpoint restricted to ROLE_PROMOTER.
 */
@RestController
@RequestMapping("/api/promotor")
@PreAuthorize("hasRole('ROLE_PROMOTER')")
public class PromotorController {

    @Autowired
    private CuponRepository cuponRepository;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.dopaminacrew.backend.repository.PromotorBonoRepository promotorBonoRepository;

    // DTO para registro de cuenta bancaria
    public static class CuentaBancariaRequest {
        public String cuentaBancaria;
        public String banco;
        public String titularCuenta;
        public String tipoCuenta; // "AHORROS" o "CORRIENTE"
    }

    public static class CuentaBancariaResponse {
        public String cuentaBancaria;
        public String banco;
        public String titularCuenta;
        public String tipoCuenta;
        public boolean registrada;
    }

    public static class PromotorStats {
        public String codigoCupon;
        public long usosActivos;
        public int totalPreventa;
        public int totalRegular;
        public int totalBoletas;
        public double totalComision;
        public double totalVentasFacturado;
    }

    public static class VentaPromotorDTO {
        public Long id;
        public String fecha;
        public String eventoNombre;
        public int cantidadPreventa;
        public int cantidadRegular;
        public double total;
        public double comision;
        public String estado;
    }

    @GetMapping("/stats")
    public ResponseEntity<PromotorStats> getStats(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        List<Cupon> cupones = cuponRepository.findByPromotorId(currentUser.getId());
        PromotorStats stats = new PromotorStats();

        if (cupones.isEmpty()) {
            stats.codigoCupon = "SIN_CUPON";
            stats.usosActivos = 0;
            stats.totalPreventa = 0;
            stats.totalRegular = 0;
            stats.totalBoletas = 0;
            stats.totalComision = 0.0;
            stats.totalVentasFacturado = 0.0;
            return ResponseEntity.ok(stats);
        }

        stats.codigoCupon = cupones.stream().map(Cupon::getCodigo).collect(Collectors.joining(", "));

        List<String> codigos = cupones.stream().map(Cupon::getCodigo).collect(Collectors.toList());
        List<Compra> compras = compraRepository.findUsagesByCodigoCuponIn(codigos);

        List<Compra> comprasExitosas = compras.stream()
                .filter(c -> "PAGADO".equals(c.getEstado()) || "REGALADA".equals(c.getEstado()))
                .collect(Collectors.toList());

        stats.usosActivos = comprasExitosas.size();
        stats.totalPreventa = comprasExitosas.stream().mapToInt(c -> c.getCantidadPreventa() != null ? c.getCantidadPreventa() : 0).sum();
        stats.totalRegular = comprasExitosas.stream().mapToInt(c -> c.getCantidadRegular() != null ? c.getCantidadRegular() : 0).sum();
        stats.totalBoletas = stats.totalPreventa + stats.totalRegular;
        
        double totalComisionCompras = comprasExitosas.stream().mapToDouble(c -> c.getComisionPromotor() != null ? c.getComisionPromotor() : 0.0).sum();
        double totalBonosPasados = promotorBonoRepository.findByPromotorId(currentUser.getId()).stream()
                .filter(b -> b.getFecha() != null && b.getFecha().isBefore(java.time.LocalDate.now()))
                .mapToDouble(b -> b.getValorBono() != null ? b.getValorBono() : 0.0)
                .sum();
        stats.totalComision = totalComisionCompras + totalBonosPasados;
        
        stats.totalVentasFacturado = comprasExitosas.stream().mapToDouble(Compra::getTotal).sum();

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/ventas")
    public ResponseEntity<List<VentaPromotorDTO>> getVentas(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        List<Cupon> cupones = cuponRepository.findByPromotorId(currentUser.getId());
        if (cupones.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<String> codigos = cupones.stream().map(Cupon::getCodigo).collect(Collectors.toList());
        List<Compra> compras = compraRepository.findUsagesByCodigoCuponIn(codigos);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        List<VentaPromotorDTO> dtos = compras.stream().map(c -> {
            VentaPromotorDTO dto = new VentaPromotorDTO();
            dto.id = c.getId();
            dto.fecha = c.getCreatedAt() != null ? c.getCreatedAt().format(formatter) : "";
            dto.eventoNombre = c.getEvento() != null ? c.getEvento().getNombre() : "Evento General";
            dto.cantidadPreventa = c.getCantidadPreventa() != null ? c.getCantidadPreventa() : 0;
            dto.cantidadRegular = c.getCantidadRegular() != null ? c.getCantidadRegular() : 0;
            dto.total = c.getTotal();
            dto.comision = c.getComisionPromotor() != null ? c.getComisionPromotor() : 0.0;
            dto.estado = c.getEstado();
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/promotor/cuenta — Retorna los datos bancarios del promotor.
     * Security Note: Solo accesible por el propio promotor autenticado (ROLE_PROMOTER).
     */
    @GetMapping("/cuenta")
    public ResponseEntity<CuentaBancariaResponse> getCuenta(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) return ResponseEntity.status(401).build();
        User user = userRepository.findById(currentUser.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(404).build();

        CuentaBancariaResponse resp = new CuentaBancariaResponse();
        resp.cuentaBancaria = user.getCuentaBancaria();
        resp.banco = user.getBanco();
        resp.titularCuenta = user.getTitularCuenta();
        resp.tipoCuenta = user.getTipoCuenta();
        resp.registrada = user.getCuentaBancaria() != null && !user.getCuentaBancaria().isBlank();
        return ResponseEntity.ok(resp);
    }

    /**
     * PUT /api/promotor/cuenta — Guarda o actualiza los datos bancarios del promotor.
     * Security Note: Valida que los campos no estén vacíos antes de persistir.
     * Solo accesible por el propio promotor autenticado (ROLE_PROMOTER).
     */
    @PutMapping("/cuenta")
    public ResponseEntity<?> saveCuenta(@AuthenticationPrincipal UserPrincipal currentUser,
                                         @RequestBody CuentaBancariaRequest req) {
        if (currentUser == null) return ResponseEntity.status(401).build();
        if (req.cuentaBancaria == null || req.cuentaBancaria.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El número de cuenta es obligatorio."));
        }
        if (req.banco == null || req.banco.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El banco es obligatorio."));
        }
        if (req.titularCuenta == null || req.titularCuenta.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre del titular es obligatorio."));
        }

        User user = userRepository.findById(currentUser.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(404).build();

        user.setCuentaBancaria(req.cuentaBancaria.trim());
        user.setBanco(req.banco.trim());
        user.setTitularCuenta(req.titularCuenta.trim());
        user.setTipoCuenta(req.tipoCuenta != null ? req.tipoCuenta.trim() : "AHORROS");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("mensaje", "Datos bancarios guardados correctamente."));
    }

    @GetMapping("/ranking")
    public ResponseEntity<?> getRanking() {
        List<Cupon> cupones = cuponRepository.findAll();
        Map<User, Integer> ventasPorPromotor = new HashMap<>();

        for (Cupon cupon : cupones) {
            if (cupon.getPromotor() == null) continue;
            
            List<Compra> compras = compraRepository.findUsagesByCodigoCupon(cupon.getCodigo());
            int totalBoletas = compras.stream()
                .filter(c -> "PAGADO".equals(c.getEstado()) || "REGALADA".equals(c.getEstado()))
                .mapToInt(c -> c.getCantidad() != null ? c.getCantidad() : 0)
                .sum();
                
            User promotor = cupon.getPromotor();
            ventasPorPromotor.put(promotor, ventasPorPromotor.getOrDefault(promotor, 0) + totalBoletas);
        }

        // Convert and sort
        List<Map<String, Object>> ranking = ventasPorPromotor.entrySet().stream()
            .map(entry -> {
                User promotor = entry.getKey();
                String nombreCompleto = promotor.getNombre() != null ? promotor.getNombre().trim() : "Promotor";
                String[] parts = nombreCompleto.split("\\s+");
                String nombreFormateado = parts[0];
                if (parts.length > 1 && !parts[1].isEmpty()) {
                    nombreFormateado += " " + parts[1].substring(0, 1).toUpperCase() + ".";
                }
                
                Map<String, Object> item = new HashMap<>();
                item.put("nombre", nombreFormateado);
                item.put("boletas", entry.getValue());
                return item;
            })
            .sorted((a, b) -> Integer.compare((Integer) b.get("boletas"), (Integer) a.get("boletas")))
            .limit(5)
            .collect(Collectors.toList());

        return ResponseEntity.ok(ranking);
    }
}
