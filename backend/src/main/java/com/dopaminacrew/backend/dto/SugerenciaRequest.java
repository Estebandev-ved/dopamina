package com.dopaminacrew.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SugerenciaRequest {

    @NotBlank(message = "El contenido de la sugerencia es obligatorio.")
    private String contenido;

    private String nombre;

    private String email;
}
