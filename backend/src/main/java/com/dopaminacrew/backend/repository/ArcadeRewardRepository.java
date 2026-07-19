package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.ArcadeReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

/**
 * Data access layer for ArcadeReward entity.
 */
@Repository
public interface ArcadeRewardRepository extends JpaRepository<ArcadeReward, Long> {

    /** Best reward the user already earned today for a given game (for the daily upgrade rule). */
    Optional<ArcadeReward> findFirstByUsuarioIdAndJuegoAndFechaOrderByTierDesc(Long usuarioId, String juego, LocalDate fecha);

    /** Whether the user has ever earned a reward at or above the given tier (lifetime free-ticket cap). */
    boolean existsByUsuarioIdAndTierGreaterThanEqual(Long usuarioId, Integer tier);
}
