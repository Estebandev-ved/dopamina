package com.dopaminacrew.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * DTO representing the request payload for gifting tickets (cortesías) from the admin panel.
 */
@Data
public class RegaloBoletaRequest {

    @NotNull(message = "El ID del evento es requerido")
    private Long eventoId;

    @NotBlank(message = "El nombre del beneficiario es requerido")
    private String nombre;

    @NotBlank(message = "El correo electrónico es requerido")
    @Email(message = "El formato de correo electrónico no es válido")
    private String email;

    private String telefono = "3000000000";

    @NotNull(message = "La cantidad de boletas es requerida")
    @Min(value = 1, message = "La cantidad mínima debe ser 1")
    private Integer cantidad;

    private String nota;
}
