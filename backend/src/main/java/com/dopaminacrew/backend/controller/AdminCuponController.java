package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.Cupon;
import com.dopaminacrew.backend.repository.CompraRepository;
import com.dopaminacrew.backend.repository.CuponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * AdminCuponController — REST endpoints for admin coupon management (cuponera).
 */
@RestController
@RequestMapping("/api/admin/cupones")
@PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
public class AdminCuponController {

    @Autowired
    private CuponRepository cuponRepository;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private com.dopaminacrew.backend.repository.UserRepository userRepository;

    /** DTO para detallar el uso de un cupón por un usuario. */
    public static class UsoUsuario {
        public Long usuarioId;
        public String nombre;
        public String email;
        public Long compraId;
        public String compraEstado;
        public String fecha;
    }

    /** DTO del reporte general de cada cupón. */
    public static class CuponReporte {
        public Long id;
        public String codigo;
        public Double descuentoPorcentaje;
        public Boolean activo;
        public String descripcion;
        public Integer maxUsos;
        public Integer minBoletas;
        public long usosActuales;
        public Long promotorId;
        public String promotorNombre;
        public String promotorEmail;
        public String promotorCuentaBancaria;
        public String promotorBanco;
        public String promotorTitularCuenta;
        public String promotorTipoCuenta;
        public Double totalComisionAcumulada;
        public int totalPreventa;
        public int totalRegular;
        public Double totalVentasGeneradas;
        public List<UsoUsuario> usuarios;
    }

    /** Lists all coupons sorted by creation date. */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Cupon>> listarCupones() {
        return ResponseEntity.ok(cuponRepository.findAll());
    }

    /** Genera el reporte detallado de usos de cupones para el panel de administración. */
    @GetMapping("/reporte")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CuponReporte>> obtenerReporteCupones() {
        List<Cupon> cupones = cuponRepository.findAll();
        List<CuponReporte> reporte = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (Cupon cupon : cupones) {
            CuponReporte r = new CuponReporte();
            r.id = cupon.getId();
            r.codigo = cupon.getCodigo();
            r.descuentoPorcentaje = cupon.getDescuentoPorcentaje();
            r.activo = cupon.getActivo();
            r.descripcion = cupon.getDescripcion();
            r.maxUsos = cupon.getMaxUsos();
            r.minBoletas = cupon.getMinBoletas();

            if (cupon.getPromotor() != null) {
                r.promotorId = cupon.getPromotor().getId();
                r.promotorNombre = cupon.getPromotor().getNombre();
                r.promotorEmail = cupon.getPromotor().getEmail();
                r.promotorCuentaBancaria = cupon.getPromotor().getCuentaBancaria();
                r.promotorBanco = cupon.getPromotor().getBanco();
                r.promotorTitularCuenta = cupon.getPromotor().getTitularCuenta();
                r.promotorTipoCuenta = cupon.getPromotor().getTipoCuenta();
            }

            // Buscar compras que usaron este cupón
            List<Compra> compras = compraRepository.findUsagesByCodigoCupon(cupon.getCodigo());
            List<Compra> comprasExitosas = compras.stream()
                .filter(c -> "PAGADO".equals(c.getEstado()) || "REGALADA".equals(c.getEstado()))
                .collect(java.util.stream.Collectors.toList());

            r.usosActuales = comprasExitosas.size();

            r.totalComisionAcumulada = comprasExitosas.stream()
                .mapToDouble(c -> c.getComisionPromotor() != null ? c.getComisionPromotor() : 0.0)
                .sum();

            r.totalPreventa = comprasExitosas.stream()
                .mapToInt(c -> c.getCantidadPreventa() != null ? c.getCantidadPreventa() : 0)
                .sum();

            r.totalRegular = comprasExitosas.stream()
                .mapToInt(c -> c.getCantidadRegular() != null ? c.getCantidadRegular() : 0)
                .sum();

            r.totalVentasGeneradas = comprasExitosas.stream()
                .mapToDouble(c -> c.getSubtotal() != null ? c.getSubtotal() : 0.0)
                .sum();

            List<UsoUsuario> usuariosLista = new ArrayList<>();
            for (Compra c : compras) {
                UsoUsuario u = new UsoUsuario();
                u.usuarioId = c.getUsuario().getId();
                u.nombre = c.getUsuario().getNombre();
                u.email = c.getUsuario().getEmail();
                u.compraId = c.getId();
                u.compraEstado = c.getEstado();
                u.fecha = c.getCreatedAt() != null ? c.getCreatedAt().format(formatter) : "";
                usuariosLista.add(u);
            }
            r.usuarios = usuariosLista;
            reporte.add(r);
        }

        return ResponseEntity.ok(reporte);
    }

    /** Creates a new coupon. */
    @PostMapping
    @Transactional
    public ResponseEntity<?> crearCupon(@RequestBody Cupon nuevoCupon) {
        if (nuevoCupon.getCodigo() == null || nuevoCupon.getCodigo().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: El código de cupón es requerido."));
        }
        if (nuevoCupon.getDescuentoPorcentaje() == null || nuevoCupon.getDescuentoPorcentaje() <= 0 || nuevoCupon.getDescuentoPorcentaje() > 100) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: El porcentaje de descuento debe estar entre 0.1 y 100."));
        }

        String codigoNormalized = nuevoCupon.getCodigo().trim().toUpperCase();
        Optional<Cupon> existing = cuponRepository.findByCodigoIgnoreCase(codigoNormalized);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Ya existe un cupón con el código '" + codigoNormalized + "'."));
        }

        if (nuevoCupon.getPromotor() != null && nuevoCupon.getPromotor().getId() != null) {
            com.dopaminacrew.backend.model.User promotor = userRepository.findById(nuevoCupon.getPromotor().getId())
                    .orElseThrow(() -> new RuntimeException("Error: Promotor no encontrado."));
            nuevoCupon.setPromotor(promotor);
        } else {
            nuevoCupon.setPromotor(null);
        }

        nuevoCupon.setCodigo(codigoNormalized);
        nuevoCupon.setActivo(nuevoCupon.getActivo() != null ? nuevoCupon.getActivo() : true);
        nuevoCupon.setMaxUsos(nuevoCupon.getMaxUsos() != null ? nuevoCupon.getMaxUsos() : 0);
        nuevoCupon.setMinBoletas(nuevoCupon.getMinBoletas() != null ? nuevoCupon.getMinBoletas() : 1);
        Cupon saved = cuponRepository.save(nuevoCupon);
        return ResponseEntity.ok(saved);
    }

    /** Toggles the active status of a coupon. */
    @PutMapping("/{id}/toggle")
    @Transactional
    public ResponseEntity<?> toggleCuponStatus(@PathVariable("id") Long id) {
        Optional<Cupon> cuponOpt = cuponRepository.findById(id);
        if (cuponOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Cupón no encontrado."));
        }

        Cupon cupon = cuponOpt.get();
        cupon.setActivo(!cupon.getActivo());
        Cupon saved = cuponRepository.save(cupon);
        return ResponseEntity.ok(saved);
    }

    /** Deletes a coupon. */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> eliminarCupon(@PathVariable("id") Long id) {
        Optional<Cupon> cuponOpt = cuponRepository.findById(id);
        if (cuponOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: Cupón no encontrado."));
        }

        cuponRepository.delete(cuponOpt.get());
        return ResponseEntity.ok(new MessageResponse("Cupón eliminado exitosamente."));
    }
}
