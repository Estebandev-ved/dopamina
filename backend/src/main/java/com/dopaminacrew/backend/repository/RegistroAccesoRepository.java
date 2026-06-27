package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.RegistroAcceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Data access layer for RegistroAcceso entity.
 */
@Repository
public interface RegistroAccesoRepository extends JpaRepository<RegistroAcceso, Long> {
    List<RegistroAcceso> findTop50ByOrderByCreatedAtDesc();
}
