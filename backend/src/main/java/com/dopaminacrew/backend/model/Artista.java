package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity mapping representing local or guest artists in the 'artistas' table.
 */
@Entity
@Table(name = "artistas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Artista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String genero;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "imagen_url", length = 2048)
    private String imagenUrl;

    @Column(name = "instagram_url", length = 1000)
    private String instagramUrl;

    @Column(name = "soundcloud_url", length = 1000)
    private String soundcloudUrl;

    @Column(nullable = false)
    private Boolean local = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
