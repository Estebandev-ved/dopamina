package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.ComboItemClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComboItemClaimRepository extends JpaRepository<ComboItemClaim, Long> {

    List<ComboItemClaim> findByCompraId(Long compraId);

    Optional<ComboItemClaim> findByCompraIdAndItemNombre(Long compraId, String itemNombre);

    List<ComboItemClaim> findByCompra_Usuario_Id(Long usuarioId);

    List<ComboItemClaim> findByCompraIdIn(List<Long> compraIds);
}
