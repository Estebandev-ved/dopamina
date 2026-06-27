package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Canje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Data access layer for Canje entity.
 * Security Note:
 * - Employs Spring Data JPA which uses prepared statements internally, preventing SQL injection.
 */
@Repository
public interface CanjeRepository extends JpaRepository<Canje, Long> {
    
    List<Canje> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);

    List<Canje> findAllByOrderByCreatedAtDesc();
}
