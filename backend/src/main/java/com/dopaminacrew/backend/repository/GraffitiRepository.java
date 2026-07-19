package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Graffiti;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GraffitiRepository extends JpaRepository<Graffiti, Long> {
    List<Graffiti> findByActivoTrueOrderByCreatedAtDesc();
    List<Graffiti> findAllByOrderByCreatedAtDesc();
}
