package com.dopaminacrew.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO representing security report submission payload.
 */
@Data
public class ReporteSeguridadRequest {

    @NotBlank(message = "El tipo de reporte es requerido")
    private String tipo;

    @NotBlank(message = "La ubicación es requerida")
    private String ubicacion;

    @NotBlank(message = "La descripción de la alerta es requerida")
    private String descripcion;

    private Boolean anonimo;
}
