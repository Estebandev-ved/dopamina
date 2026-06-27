package com.dopaminacrew.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO representing ticket transfer payload.
 */
@Data
public class TransferenciaRequest {

    @NotNull(message = "El ID de la boleta es requerido")
    private Long boletaId;

    @NotBlank(message = "El correo de destino es requerido")
    @Email(message = "El formato de correo de destino no es válido")
    private String emailDestino;
}
