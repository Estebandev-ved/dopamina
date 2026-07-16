package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Combo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Data access layer for Combo entity.
 */
@Repository
public interface ComboRepository extends JpaRepository<Combo, Long> {

    List<Combo> findByActivoTrue();
}
