package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Sugerencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SugerenciaRepository extends JpaRepository<Sugerencia, Long> {

    List<Sugerencia> findAllByOrderByCreatedAtDesc();
}
