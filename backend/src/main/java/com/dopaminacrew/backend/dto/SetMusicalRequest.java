package com.dopaminacrew.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class SetMusicalRequest {

    @NotBlank(message = "El título es obligatorio")
    @Size(max = 200, message = "El título no puede exceder 200 caracteres")
    private String titulo;

    @Size(max = 100, message = "El nombre del artista no puede exceder 100 caracteres")
    private String artista;

    @NotBlank(message = "La URL de YouTube es obligatoria")
    @Size(max = 1000, message = "La URL de YouTube es demasiado larga")
    private String youtubeUrl;

    @Size(max = 100, message = "El género no puede exceder 100 caracteres")
    private String genero;

    private String descripcion;

    @Size(max = 2048, message = "La URL de la imagen es demasiado larga")
    private String imagenUrl;

    private Boolean activo;
}
