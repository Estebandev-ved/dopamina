package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.ReporteSeguridad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository interface for ReporteSeguridad entity.
 */
@Repository
public interface ReporteSeguridadRepository extends JpaRepository<ReporteSeguridad, Long> {
    List<ReporteSeguridad> findAllByOrderByCreatedAtDesc();
}
