package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO returned to clients for an Evento.
 * Security Note: Only safe fields exposed — no internal audit timestamps.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventoResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private String fecha;
    private String hora;
    private String lugar;
    private String ciudad;
    private Double precio;
    private Double precioPreventa;
    private Integer cantidadPreventa;
    private Integer vendidas;        // entradas ya vendidas (para calcular cupo de preventa)
    private Integer capacidad;
    private String imagenUrl;
    private String lineup;
    private Boolean activo;
    private Boolean destacado;
    private String createdAt;
}
