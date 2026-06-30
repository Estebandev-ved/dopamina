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
        public long usosActuales;
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

            // Buscar compras que usaron este cupón
            List<Compra> compras = compraRepository.findUsagesByCodigoCupon(cupon.getCodigo());
            r.usosActuales = compras.stream()
                .filter(c -> "PAGADO".equals(c.getEstado()) || "REGALADA".equals(c.getEstado()))
                .count();

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

        nuevoCupon.setCodigo(codigoNormalized);
        nuevoCupon.setActivo(nuevoCupon.getActivo() != null ? nuevoCupon.getActivo() : true);
        nuevoCupon.setMaxUsos(nuevoCupon.getMaxUsos() != null ? nuevoCupon.getMaxUsos() : 0);
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
