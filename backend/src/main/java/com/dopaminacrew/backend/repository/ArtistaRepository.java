package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Artista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Data access layer for Artista entity.
 */
@Repository
public interface ArtistaRepository extends JpaRepository<Artista, Long> {
    List<Artista> findAllByOrderByNombreAsc();
}
