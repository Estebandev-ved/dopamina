package com.dopaminacrew.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

/**
 * DTO for creating or updating an Artista.
 */
@Data
public class ArtistaRequest {

    @NotBlank(message = "El nombre del artista es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;

    @NotBlank(message = "El género musical es obligatorio")
    @Size(max = 100, message = "El género no puede exceder 100 caracteres")
    private String genero;

    private String bio;

    @Size(max = 2048, message = "La URL de la imagen es demasiado larga")
    private String imagenUrl;

    @Size(max = 1000, message = "La URL de Instagram es demasiado larga")
    private String instagramUrl;

    @Size(max = 1000, message = "La URL de Soundcloud es demasiado larga")
    private String soundcloudUrl;

    private Boolean local;
}
