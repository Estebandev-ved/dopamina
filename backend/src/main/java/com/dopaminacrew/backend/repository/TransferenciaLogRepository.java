package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.TransferenciaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository interface for TransferenciaLog entity.
 */
@Repository
public interface TransferenciaLogRepository extends JpaRepository<TransferenciaLog, Long> {
    List<TransferenciaLog> findAllByOrderByFechaTransferenciaDesc();
}
