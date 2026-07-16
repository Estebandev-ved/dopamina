package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO representing details of an individual ticket response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoletaResponse {
    private Long id;
    private String eventoNombre;
    private String eventoFecha;
    private String eventoHora;
    private String eventoLugar;
    private String eventoCiudad;
    private String codigoQr;
    private String estado;
    private LocalDateTime createdAt;
    private String usuarioNombre;
    private Integer numeroSorteo;
    private String comboNombre;
    private String comboItems;
    private Boolean requiereVerificacionCumple = false;
}
