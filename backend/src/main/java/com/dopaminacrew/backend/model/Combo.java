package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity mapping representing dynamic purchase combos in the 'combos' table.
 */
@Entity
@Table(name = "combos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Combo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    private Double precio;

    @Column(name = "precio_original")
    private Double precioOriginal = 0.0;

    @Column(name = "cantidad_boletas", nullable = false)
    private Integer cantidadBoletas = 1;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @Column(name = "items_adicionales", length = 255)
    private String itemsAdicionales;

    @Column(name = "es_cumpleanero", nullable = false)
    private Boolean esCumpleanero = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
