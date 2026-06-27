package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.dto.AdminStatsResponse;
import java.util.List;

/**
 * Service interface for admin dashboard operations.
 * Security Note: All methods here are restricted to ROLE_ADMIN via @PreAuthorize in the controller.
 */
public interface AdminService {

    AdminStatsResponse getStats();

    List<AdminStatsResponse.CompraAdminDTO> getAllCompras();

    List<AdminStatsResponse.UsuarioAdminDTO> getAllUsuarios();

    void deleteCompra(Long id);

    void deleteUsuario(Long id);
}
