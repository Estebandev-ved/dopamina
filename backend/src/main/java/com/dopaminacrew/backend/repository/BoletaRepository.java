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

    @Query("SELECT b FROM Boleta b JOIN b.compra c WHERE (b.usuario IS NULL AND c.usuario.id = :userId) OR (b.usuario.id = :userId) ORDER BY b.createdAt DESC")
    List<Boleta> findByUsuarioIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}
