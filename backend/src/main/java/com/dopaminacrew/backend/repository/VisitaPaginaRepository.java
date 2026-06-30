package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.VisitaPagina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VisitaPaginaRepository extends JpaRepository<VisitaPagina, Long> {

    List<VisitaPagina> findAllByOrderByCreatedAtDesc();

    List<VisitaPagina> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime after);

    long countByCreatedAtAfter(LocalDateTime after);

    @Query("SELECT v.pagina, COUNT(v) as cnt FROM VisitaPagina v GROUP BY v.pagina ORDER BY cnt DESC")
    List<Object[]> countByPagina();

    @Query("SELECT FUNCTION('DATE', v.createdAt), COUNT(v) FROM VisitaPagina v GROUP BY FUNCTION('DATE', v.createdAt) ORDER BY FUNCTION('DATE', v.createdAt)")
    List<Object[]> countByDay();

    @Query("SELECT COUNT(v) FROM VisitaPagina v WHERE v.usuario IS NOT NULL")
    long countAuthenticated();

    @Query("SELECT COUNT(v) FROM VisitaPagina v WHERE v.usuario IS NULL")
    long countAnonymous();
}
