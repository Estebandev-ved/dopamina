package com.dopaminacrew.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for Google Authentication payload.
 */
@Data
public class GoogleLoginRequest {

    @NotBlank(message = "El email no puede estar vacío")
    @Email(message = "Debe proporcionar una dirección de email válida")
    private String email;

    @NotBlank(message = "El nombre no puede estar vacío")
    private String nombre;

    @NotBlank(message = "El Google ID es requerido")
    private String googleId;
}
