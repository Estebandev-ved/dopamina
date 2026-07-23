package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.GastoEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GastoEventoRepository extends JpaRepository<GastoEvento, Long> {

    List<GastoEvento> findByEventoIdOrderByCreatedAtAsc(Long eventoId);

    void deleteByEventoId(Long eventoId);

    long countByEventoId(Long eventoId);
}
