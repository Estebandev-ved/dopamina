package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetMusicalResponse {
    private Long id;
    private String titulo;
    private String artista;
    private String youtubeUrl;
    private String genero;
    private String descripcion;
    private String imagenUrl;
    private Boolean activo;
    private LocalDateTime createdAt;
}
