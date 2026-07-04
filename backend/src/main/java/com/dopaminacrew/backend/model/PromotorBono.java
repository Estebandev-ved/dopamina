package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity to track earned promoter bonuses for daily challenges (Didi-style milestones).
 */
@Entity
@Table(name = "promotor_bonos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromotorBono {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "promotor_id", nullable = false)
    private User promotor;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "cantidad_requerida", nullable = false)
    private Integer cantidadRequerida;

    @Column(name = "valor_bono", nullable = false)
    private Double valorBono;

    @Column(nullable = false)
    private Boolean pagado = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
