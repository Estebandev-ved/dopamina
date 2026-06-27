package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO representing details of a successful purchase response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompraResponse {
    private Long id;
    private Integer cantidad;
    private Double subtotal;
    private Double descuento;
    private Double total;
    private String codigoCupon;
    private String estado;
    private String codigoQr;
    private LocalDateTime createdAt;

    // Event details
    private String eventoNombre;
    private String eventoFecha;
    private String eventoHora;
    private String eventoLugar;
    private String eventoCiudad;
}
