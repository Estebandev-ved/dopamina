package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO representing security report details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporteSeguridadResponse {
    private Long id;
    private String usuarioNombre;
    private String usuarioEmail;
    private String tipo;
    private String ubicacion;
    private String descripcion;
    private String estado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
