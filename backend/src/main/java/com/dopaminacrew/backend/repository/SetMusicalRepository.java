package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.SetMusical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SetMusicalRepository extends JpaRepository<SetMusical, Long> {
    List<SetMusical> findAllByOrderByCreatedAtDesc();
    List<SetMusical> findByActivoTrueOrderByCreatedAtDesc();
    List<SetMusical> findByGeneroIgnoreCaseOrderByCreatedAtDesc(String genero);
    List<SetMusical> findByActivoTrueAndGeneroIgnoreCaseOrderByCreatedAtDesc(String genero);
}
