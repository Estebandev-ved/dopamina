package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO for Admin Dashboard statistics.
 * Security Note: Only returned to users with ROLE_ADMIN via @PreAuthorize.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

    private long totalUsuarios;
    private long totalCompras;
    private double totalIngresos;
    private long totalBoletas;
    private double promedioBoletasPorCompra;
    private List<CompraAdminDTO> ultimasCompras;
    private List<UsuarioAdminDTO> ultimosUsuarios;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompraAdminDTO {
        private Long id;
        private String usuarioNombre;
        private String usuarioEmail;
        private Integer cantidad;
        private Double total;
        private Double descuento;
        private String codigoCupon;
        private String estado;
        private String codigoQr;
        private String createdAt;
        private String eventoNombre;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsuarioAdminDTO {
        private Long id;
        private String nombre;
        private String email;
        private String telefono;
        private String rol;
        private String createdAt;
        private long totalCompras;
        private double totalGastado;
        private Boolean banned;
    }
}
