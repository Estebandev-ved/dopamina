package com.dopaminacrew.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO representing a request to send a manual custom email from the Admin Dashboard.
 */
@Data
public class EmailManualRequest {

    @NotBlank(message = "El correo de destino es obligatorio")
    @Email(message = "El formato de correo es inválido")
    private String to;
    
    @NotBlank(message = "El asunto es obligatorio")
    private String subject;
    
    @NotBlank(message = "El mensaje no puede estar vacío")
    private String body;
}
