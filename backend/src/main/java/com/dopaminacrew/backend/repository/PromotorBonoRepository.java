package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.PromotorBono;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface PromotorBonoRepository extends JpaRepository<PromotorBono, Long> {
    List<PromotorBono> findByPromotorId(Long promotorId);
    List<PromotorBono> findByPromotorIdAndFecha(Long promotorId, LocalDate fecha);
    boolean existsByPromotorIdAndFechaAndCantidadRequerida(Long promotorId, LocalDate fecha, Integer cantidadRequerida);
}
