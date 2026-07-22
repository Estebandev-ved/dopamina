package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.ArcadeReward;
import com.dopaminacrew.backend.model.Cupon;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.ArcadeRewardRepository;
import com.dopaminacrew.backend.repository.CuponRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * ArcadeController — turns arcade scores into real discount coupons / free tickets.
 *
 * Anti-abuse rules (best-effort; scores are computed client-side so this is not
 * tamper-proof, only friction):
 *  - Score thresholds are validated on the server (per game).
 *  - One upgradeable reward per game per day: replaying only helps if you beat
 *    your best tier of the day; a lower/equal result returns the existing coupon.
 *  - The "free ticket" (tier 4, a 100% coupon) is capped to ONCE per account
 *    lifetime; further tier-4 results are downgraded to the best discount (tier 3).
 *  - Every generated coupon is single-use (maxUsos = 1) and, at checkout, also
 *    limited to one use per user.
 */
@RestController
@RequestMapping("/api/arcade")
public class ArcadeController {

    @Autowired
    private ArcadeRewardRepository arcadeRewardRepository;

    @Autowired
    private CuponRepository cuponRepository;

    @Autowired
    private UserRepository userRepository;

    /** Discount percentage awarded per tier (index 0 => tier 1). Tier 4 = free ticket. */
    private static final double[] TIER_PCT = { 5.0, 10.0, 20.0, 100.0 };
    private static final int TOP_TIER = 4;

    /** Score needed to reach tiers 1..4, per game key. */
    private static final Map<String, int[]> THRESHOLDS = Map.of(
            "catch",    new int[] { 80, 200, 400, 3000 },
            "runner",   new int[] { 80, 200, 400, 3000 },
            "snake",    new int[] { 50, 120, 250, 3000 },
            "beattap",  new int[] { 300, 700, 1200, 3000 },
            "sequence", new int[] { 120, 300, 600, 3000 }
    );

    /** Human-friendly game names for the coupon description. */
    private static final Map<String, String> NOMBRES = Map.of(
            "catch",    "Dopamine Catch",
            "runner",   "Rave Runner",
            "snake",    "Neon Snake",
            "beattap",  "Beat Tap",
            "sequence", "Sequence Sync"
    );

    /** Request payload sent by the arcade when a game ends. */
    public static class RewardRequest {
        public String juego;
        public Integer puntaje;
    }

    @PostMapping("/reward")
    @Transactional
    public ResponseEntity<?> claimReward(@RequestBody RewardRequest body,
                                         @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("Inicia sesión para reclamar tu premio."));
        }
        if (body == null || body.juego == null || body.puntaje == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Datos incompletos."));
        }

        String juego = body.juego.trim().toLowerCase();
        int[] thresholds = THRESHOLDS.get(juego);
        if (thresholds == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Juego no válido."));
        }

        int puntaje = Math.max(0, body.puntaje);
        int newTier = computeTier(thresholds, puntaje);

        Map<String, Object> resp = new HashMap<>();
        resp.put("juego", juego);
        resp.put("puntaje", puntaje);

        if (newTier == 0) {
            resp.put("premio", false);
            resp.put("mensaje", "Aún no alcanzas el mínimo para un premio. ¡Sigue jugando!");
            resp.put("siguienteNivelEn", thresholds[0]);
            return ResponseEntity.ok(resp);
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        LocalDate hoy = LocalDate.now();
        Optional<ArcadeReward> existingOpt =
                arcadeRewardRepository.findFirstByUsuarioIdAndJuegoAndFechaOrderByTierDesc(user.getId(), juego, hoy);

        boolean yaTieneBoletaGratis = arcadeRewardRepository.existsByUsuarioIdAndTierGreaterThanEqual(user.getId(), TOP_TIER);
        boolean downgradedFree = false;

        // Lifetime cap on the free ticket: if the user already claimed a tier-4 on a
        // previous day, cap this result at the best discount tier (3).
        if (newTier == TOP_TIER && yaTieneBoletaGratis
                && (existingOpt.isEmpty() || existingOpt.get().getTier() < TOP_TIER)) {
            newTier = TOP_TIER - 1;
            downgradedFree = true;
        }

        // Daily upgrade rule: if today's best is equal or better, return it unchanged.
        if (existingOpt.isPresent() && existingOpt.get().getTier() >= newTier) {
            ArcadeReward prev = existingOpt.get();
            Cupon cuponPrev = cuponRepository.findByCodigoIgnoreCase(prev.getCodigoCupon()).orElse(null);
            fillCouponResponse(resp, prev.getTier(), prev.getCodigoCupon(),
                    cuponPrev != null ? cuponPrev.getDescuentoPorcentaje() : TIER_PCT[prev.getTier() - 1]);
            resp.put("yaReclamado", true);
            resp.put("mensaje", "Ya tienes un premio igual o mejor de este juego hoy.");
            if (downgradedFree) {
                resp.put("mensaje", "Ya usaste tu boleta gratis (1 por cuenta). Este es tu mejor descuento disponible.");
            }
            return ResponseEntity.ok(resp);
        }

        // We improved on today's result (or it's the first of the day) → issue a new coupon.
        double pct = TIER_PCT[newTier - 1];
        String codigo = generateUniqueCode(juego);

        Cupon cupon = new Cupon();
        cupon.setCodigo(codigo);
        cupon.setDescuentoPorcentaje(pct);
        cupon.setActivo(true);
        cupon.setMaxUsos(1);
        cupon.setMinBoletas(1);
        cupon.setPromotor(null); // no promoter commission for arcade prizes
        cupon.setDescripcion("Premio Arcade — " + NOMBRES.getOrDefault(juego, juego)
                + " (nivel " + newTier + ") — " + user.getEmail());
        cuponRepository.save(cupon);

        // Deactivate the superseded coupon from earlier today, if any.
        if (existingOpt.isPresent()) {
            cuponRepository.findByCodigoIgnoreCase(existingOpt.get().getCodigoCupon()).ifPresent(old -> {
                old.setActivo(false);
                cuponRepository.save(old);
            });
        }

        ArcadeReward reward = existingOpt.orElseGet(ArcadeReward::new);
        reward.setUsuario(user);
        reward.setJuego(juego);
        reward.setTier(newTier);
        reward.setPuntaje(puntaje);
        reward.setCodigoCupon(codigo);
        reward.setFecha(hoy);
        arcadeRewardRepository.save(reward);

        fillCouponResponse(resp, newTier, codigo, pct);
        resp.put("yaReclamado", false);
        if (downgradedFree) {
            resp.put("mensaje", "¡Excelente puntaje! Pero ya usaste tu boleta gratis (1 por cuenta), así que recibes el mejor descuento.");
        } else if (newTier == TOP_TIER) {
            resp.put("mensaje", "¡BOLETA GRATIS DESBLOQUEADA! Aplica el código en el checkout.");
        } else {
            resp.put("mensaje", "¡Premio desbloqueado! Aplica el código en el checkout.");
        }
        return ResponseEntity.ok(resp);
    }

    private void fillCouponResponse(Map<String, Object> resp, int tier, String codigo, double pct) {
        resp.put("premio", true);
        resp.put("tier", tier);
        resp.put("codigo", codigo);
        resp.put("descuentoPorcentaje", pct);
        resp.put("boletaGratis", tier >= TOP_TIER);
    }

    /** Number of thresholds the score meets (0..4). */
    private int computeTier(int[] thresholds, int puntaje) {
        int tier = 0;
        for (int t : thresholds) {
            if (puntaje >= t) tier++;
        }
        return tier;
    }

    private String generateUniqueCode(String juego) {
        String prefix = "DOPA-" + juego.toUpperCase() + "-";
        for (int attempt = 0; attempt < 10; attempt++) {
            String candidate = prefix + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            if (cuponRepository.findByCodigoIgnoreCase(candidate).isEmpty()) {
                return candidate;
            }
        }
        // Extremely unlikely fallback.
        return prefix + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }
}
