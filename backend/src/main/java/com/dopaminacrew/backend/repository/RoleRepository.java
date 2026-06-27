package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Role;
import com.dopaminacrew.backend.model.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Data access layer for Role entity.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByNombre(RoleName nombre);
}
