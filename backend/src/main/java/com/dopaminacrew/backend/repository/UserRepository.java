package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Data access layer for User entity.
 * Security Note: Queries executed through JPA repositories automatically use parameterized SQL inputs, preventing SQL Injection.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Boolean existsByEmail(String email);
}
