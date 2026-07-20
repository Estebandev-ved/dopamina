package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Boleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Data access layer for Boleta entity.
 */
@Repository
public interface BoletaRepository extends JpaRepository<Boleta, Long> {

    Optional<Boleta> findByCodigoQr(String codigoQr);

    long countByCompraId(Long compraId);

    List<Boleta> findByCompraIdOrderByNumeroSorteoAsc(Long compraId);

    @Query("SELECT b FROM Boleta b JOIN b.compra c WHERE (b.usuario IS NULL AND c.usuario.id = :userId) OR (b.usuario.id = :userId) ORDER BY b.createdAt DESC")
    List<Boleta> findByUsuarioIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT MAX(b.numeroSorteo) FROM Boleta b WHERE b.compra.evento.id = :eventoId")
    Integer findMaxNumeroSorteoByEventoId(@Param("eventoId") Long eventoId);

    @Query("SELECT b FROM Boleta b JOIN b.compra c WHERE c.evento.id = :eventoId AND b.numeroSorteo = :numeroSorteo "
            + "AND (c.estado = 'PAGADO' OR c.estado = 'REGALADA')")
    Optional<Boleta> findByEventoIdAndNumeroSorteo(@Param("eventoId") Long eventoId, @Param("numeroSorteo") Integer numeroSorteo);

    @Query("SELECT b FROM Boleta b JOIN b.compra c WHERE c.evento.id = :eventoId AND b.numeroSorteo IS NOT NULL "
            + "AND (c.estado = 'PAGADO' OR c.estado = 'REGALADA') ORDER BY b.numeroSorteo ASC")
    List<Boleta> findBoletasParticipantesByEventoId(@Param("eventoId") Long eventoId);
}
