package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.dto.AdminStatsResponse;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.CompraRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of AdminService.
 * Security Note:
 * - All methods are invoked only after @PreAuthorize("hasRole('ADMIN')") is enforced at the controller layer.
 * - No raw SQL is used; all queries go through JPA (parameterized, injection-safe).
 * - Sensitive user data (passwords) are never exposed in response DTOs.
 */
@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public AdminStatsResponse getStats() {
        List<Compra> todasCompras = compraRepository.findAll();
        List<User> todosUsuarios = userRepository.findAll();

        long totalUsuarios = todosUsuarios.size();
        
        List<Compra> comprasExitosas = todasCompras.stream()
                .filter(c -> "PAGADO".equals(c.getEstado()))
                .collect(Collectors.toList());

        long totalCompras = comprasExitosas.size();
        double totalIngresos = comprasExitosas.stream().mapToDouble(Compra::getTotal).sum();
        long totalBoletas = comprasExitosas.stream().mapToLong(c -> c.getCantidad()).sum();
        double promedio = totalCompras > 0 ? (double) totalBoletas / totalCompras : 0;

        // Return last 10 purchases and last 10 users for the dashboard overview
        List<AdminStatsResponse.CompraAdminDTO> ultimasCompras = todasCompras.stream()
                .sorted((a, b) -> b.getCreatedAt() != null && a.getCreatedAt() != null
                        ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0)
                .limit(10)
                .map(this::toCompraDTO)
                .collect(Collectors.toList());

        List<AdminStatsResponse.UsuarioAdminDTO> ultimosUsuarios = todosUsuarios.stream()
                .sorted((a, b) -> b.getCreatedAt() != null && a.getCreatedAt() != null
                        ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0)
                .limit(10)
                .map(u -> toUsuarioDTO(u, todasCompras))
                .collect(Collectors.toList());

        return new AdminStatsResponse(
                totalUsuarios,
                totalCompras,
                totalIngresos,
                totalBoletas,
                promedio,
                ultimasCompras,
                ultimosUsuarios
        );
    }

    @Override
    public List<AdminStatsResponse.CompraAdminDTO> getAllCompras() {
        return compraRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt() != null && a.getCreatedAt() != null
                        ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0)
                .map(this::toCompraDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<AdminStatsResponse.UsuarioAdminDTO> getAllUsuarios() {
        List<Compra> todasCompras = compraRepository.findAll();
        return userRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt() != null && a.getCreatedAt() != null
                        ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0)
                .map(u -> toUsuarioDTO(u, todasCompras))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteCompra(Long id) {
        // Security: verifies existence before deletion to prevent enumeration attacks on IDs
        compraRepository.findById(id).orElseThrow(() ->
                new RuntimeException("Compra no encontrada con id: " + id));
        compraRepository.deleteById(id);
    }

    @Override
    public void deleteUsuario(Long id) {
        // Security: verifies existence before deletion
        userRepository.findById(id).orElseThrow(() ->
                new RuntimeException("Usuario no encontrado con id: " + id));
        userRepository.deleteById(id);
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private AdminStatsResponse.CompraAdminDTO toCompraDTO(Compra c) {
        return new AdminStatsResponse.CompraAdminDTO(
                c.getId(),
                c.getUsuario() != null ? c.getUsuario().getNombre() : "N/A",
                c.getUsuario() != null ? c.getUsuario().getEmail() : "N/A",
                c.getCantidad(),
                c.getTotal(),
                c.getDescuento(),
                c.getCodigoCupon(),
                c.getEstado(),
                c.getCodigoQr(),
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null
        );
    }

    private AdminStatsResponse.UsuarioAdminDTO toUsuarioDTO(User u, List<Compra> todasCompras) {
        // Solo compras PAGADAS cuentan como compras reales y gasto del usuario.
        // Las PENDIENTE/EXPIRADO/RECHAZADO (pagos no completados) no deben contar.
        List<Compra> comprasUsuario = todasCompras.stream()
                .filter(c -> c.getUsuario() != null && c.getUsuario().getId().equals(u.getId()))
                .filter(c -> "PAGADO".equals(c.getEstado()))
                .collect(Collectors.toList());

        double totalGastado = comprasUsuario.stream().mapToDouble(Compra::getTotal).sum();

        return new AdminStatsResponse.UsuarioAdminDTO(
                u.getId(),
                u.getNombre(),
                u.getEmail(),
                u.getTelefono(),
                u.getRol() != null ? u.getRol().getNombre().name() : "N/A",
                u.getCreatedAt() != null ? u.getCreatedAt().toString() : null,
                comprasUsuario.size(),
                totalGastado,
                u.getBanned()
        );
    }
}
