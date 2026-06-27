package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO for displaying Artista profiles to clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArtistaResponse {
    private Long id;
    private String nombre;
    private String genero;
    private String bio;
    private String imagenUrl;
    private String instagramUrl;
    private String soundcloudUrl;
    private Boolean local;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
