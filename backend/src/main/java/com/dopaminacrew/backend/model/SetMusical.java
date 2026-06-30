package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "sets_musicales")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetMusical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(length = 100)
    private String artista;

    @Column(name = "youtube_url", nullable = false, length = 1000)
    private String youtubeUrl;

    @Column(length = 100)
    private String genero;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "imagen_url", length = 2048)
    private String imagenUrl;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
