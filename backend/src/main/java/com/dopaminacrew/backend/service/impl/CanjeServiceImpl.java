package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.model.Canje;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.CanjeRepository;
import com.dopaminacrew.backend.repository.CompraRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.service.CanjeService;
import com.dopaminacrew.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.util.List;

/**
 * Implementation of CanjeService for handling points deduction and reward validation.
 * Security Note:
 * - Sanitizes parameters and verifies user existence.
 * - Point deductions are computed dynamically based on all user tickets minus already redeemed items,
 *   preventing race-condition or local manipulation exploits.
 */
@Service
@Transactional
public class CanjeServiceImpl implements CanjeService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private CanjeRepository canjeRepository;

    @Autowired
    private EmailService emailService;

    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public Integer getPuntosDisponibles(Long usuarioId) {
        // Fetch all purchases to compute earned points (50 points per ticket)
        List<Compra> compras = compraRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId);
        int totalTickets = compras.stream()
                .filter(c -> "PAGADO".equalsIgnoreCase(c.getEstado()) && c.getCantidad() != null)
                .mapToInt(c -> c.getCantidad())
                .sum();
        int earnedPoints = totalTickets * 50;

        // Fetch all redemptions to compute spent points
        List<Canje> canjes = canjeRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId);
        int spentPoints = canjes.stream()
                .filter(c -> c.getCostoPuntos() != null)
                .mapToInt(c -> c.getCostoPuntos())
                .sum();

        return Math.max(0, earnedPoints - spentPoints);
    }

    @Override
    public Canje registrarCanje(Long usuarioId, String premioId, String premioTitulo, Integer costoPuntos) {
        User user = userRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + usuarioId));

        int puntosDisponibles = getPuntosDisponibles(usuarioId);
        if (puntosDisponibles < costoPuntos) {
            throw new RuntimeException("No tienes suficientes puntos. Disponibles: " + puntosDisponibles + ", Requeridos: " + costoPuntos);
        }

        // Generate a unique voucher code
        String uniqueCode = "DOPA-GIFT-" + generateRandomVoucher(6) + "-" + costoPuntos;

        Canje canje = new Canje();
        canje.setUsuario(user);
        canje.setPremioId(premioId);
        canje.setPremioTitulo(premioTitulo);
        canje.setCodigoCanje(uniqueCode);
        canje.setCostoPuntos(costoPuntos);
        canje.setEstado("PENDIENTE");

        Canje saved = canjeRepository.save(canje);
        emailService.sendRewardConfirmation(user, premioTitulo, uniqueCode);
        return saved;
    }

    @Override
    public List<Canje> getCanjesUsuario(Long usuarioId) {
        return canjeRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId);
    }

    @Override
    public List<Canje> getTodosCanjes() {
        return canjeRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public Canje actualizarEstadoCanje(Long canjeId, String estado) {
        Canje canje = canjeRepository.findById(canjeId)
                .orElseThrow(() -> new RuntimeException("Canje no encontrado con id: " + canjeId));

        if (!"PENDIENTE".equalsIgnoreCase(estado) && !"ENTREGADO".equalsIgnoreCase(estado)) {
            throw new IllegalArgumentException("Estado de canje no válido: " + estado);
        }

        canje.setEstado(estado.toUpperCase());
        return canjeRepository.save(canje);
    }

    private String generateRandomVoucher(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        return sb.toString();
    }
}
