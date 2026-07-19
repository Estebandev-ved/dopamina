package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "combo_item_claims")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compra_id", nullable = false)
    private Compra compra;

    @Column(name = "item_nombre", nullable = false, length = 255)
    private String itemNombre;

    @Column(nullable = false)
    private Boolean reclamado = false;

    @Column(name = "reclamado_por_nombre", length = 100)
    private String reclamadoPorNombre;

    @Column(name = "reclamado_at")
    private LocalDateTime reclamadoAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
