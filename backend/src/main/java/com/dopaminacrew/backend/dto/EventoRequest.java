package com.dopaminacrew.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * DTO for creating or updating an Evento.
 * Security Note: @Valid validation prevents malformed or malicious input.
 */
@Data
public class EventoRequest {

    @NotBlank(message = "El nombre del evento es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String nombre;

    private String descripcion;

    @NotBlank(message = "La fecha es obligatoria (formato: YYYY-MM-DD)")
    private String fecha; // parsed to LocalDate in service

    @NotBlank(message = "La hora es obligatoria (formato: HH:mm)")
    private String hora;  // parsed to LocalTime in service

    @NotBlank(message = "El lugar es obligatorio")
    @Size(max = 200)
    private String lugar;

    @Size(max = 100)
    private String ciudad;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
    private BigDecimal precio;

    // Preventa (opcional). Si se definen ambos, las primeras 'cantidadPreventa'
    // entradas se venden al 'precioPreventa' y el resto al 'precio' regular.
    @DecimalMin(value = "0.0", message = "El precio de preventa no puede ser negativo")
    private BigDecimal precioPreventa;

    @Min(value = 0, message = "La cantidad de preventa no puede ser negativa")
    private Integer cantidadPreventa;

    @Min(value = 1, message = "La capacidad debe ser al menos 1")
    private Integer capacidad;

    @Size(max = 500, message = "URL de imagen demasiado larga")
    private String imagenUrl;

    private String lineup;

    private Boolean activo;

    private Boolean destacado;
}
