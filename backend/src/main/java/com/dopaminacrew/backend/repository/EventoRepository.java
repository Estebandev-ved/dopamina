package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

/**
 * Data access layer for Evento entity.
 * Security Note: All queries use JPA parameterized inputs — SQL injection safe.
 */
@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {

    // Public: active upcoming events
    List<Evento> findByActivoTrueAndFechaGreaterThanEqualOrderByFechaAsc(LocalDate today);

    // Admin: all events regardless of status
    List<Evento> findAllByOrderByFechaAsc();

    // Featured events for home page
    List<Evento> findByActivoTrueAndDestacadoTrueOrderByFechaAsc();
}
