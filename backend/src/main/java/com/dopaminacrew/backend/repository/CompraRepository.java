package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Compra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

/**
 * Data access layer for Compra entity.
 */
@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {
    
    List<Compra> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);

    @Query("SELECT SUM(c.cantidad) FROM Compra c WHERE c.evento.id = :eventoId")
    Integer sumCantidadByEventoId(@Param("eventoId") Long eventoId);
}
