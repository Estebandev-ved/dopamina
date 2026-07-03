package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Cupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Data access layer for Cupon entity.
 */
@Repository
public interface CuponRepository extends JpaRepository<Cupon, Long> {

    Optional<Cupon> findByCodigoIgnoreCase(String codigo);

    java.util.List<Cupon> findByPromotorId(Long promotorId);
}
