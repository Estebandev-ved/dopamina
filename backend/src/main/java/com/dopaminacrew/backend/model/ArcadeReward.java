package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity mapping representing an arcade reward won by a user.
 * Used to track anti-farming rules (1 upgradeable reward per game per day)
 * and the lifetime cap on the "free ticket" (tier 4) prize.
 */
@Entity
@Table(name = "arcade_rewards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcadeReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    /** Game key: 'catch', 'runner', 'snake', 'beattap', 'sequence'. */
    @Column(nullable = false, length = 30)
    private String juego;

    /** Reward tier reached: 1..4 (4 = free ticket). */
    @Column(nullable = false)
    private Integer tier;

    /** Score achieved when the reward was granted. */
    @Column(nullable = false)
    private Integer puntaje;

    /** Unique single-use coupon code generated for this reward. */
    @Column(name = "codigo_cupon", nullable = false, length = 50)
    private String codigoCupon;

    /** Day the reward was granted (used for the daily upgrade rule). */
    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
