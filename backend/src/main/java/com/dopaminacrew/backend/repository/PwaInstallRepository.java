package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.PwaInstall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface PwaInstallRepository extends JpaRepository<PwaInstall, Long> {

    long count();

    long countByCreatedAtAfter(LocalDateTime after);

    @Query("SELECT p.platform, COUNT(p) FROM PwaInstall p GROUP BY p.platform")
    java.util.List<Object[]> countByPlatform();
}
