package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.dto.CheckoutRequest;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.Evento;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.model.Boleta;
import com.dopaminacrew.backend.repository.CompraRepository;
import com.dopaminacrew.backend.repository.EventoRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.repository.BoletaRepository;
import com.dopaminacrew.backend.repository.CuponRepository;
import com.dopaminacrew.backend.service.CompraService;
import com.dopaminacrew.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

/**
 * Service implementation managing ticket bookings, pricing phases, and individual tickets.
 */
@Service
public class CompraServiceImpl implements CompraService {

    private static final double DEFAULT_TICKET_PRICE = 25000.0;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private BoletaRepository boletaRepository;

    @Autowired
    private CuponRepository cuponRepository;

    @Autowired
    private EmailService emailService;

    @Override
    @Transactional
    public Compra processCheckout(CheckoutRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado."));

        int cantidad = request.getCantidad();

        // Retrieve event if provided to determine pricing
        Evento evento = null;
        double price = DEFAULT_TICKET_PRICE;
        double subtotal;

        if (request.getEventoId() != null) {
            evento = eventoRepository.findById(request.getEventoId())
                    .orElseThrow(() -> new RuntimeException("Error: Evento no encontrado."));

            // Use the event's configured price as the base price
            if (evento.getPrecio() != null) {
                price = evento.getPrecio().doubleValue();
            }

            // Limit event capacity dynamically.
            // 'sold' = entradas pagadas + pendientes con reserva vigente (ver repositorio).
            int sold = compraRepository.contarEntradasOcupadas(evento.getId());
            int capacidad = evento.getCapacidad() != null ? evento.getCapacidad() : 1000;

            if (sold + cantidad > capacidad) {
                int cuposRestantes = capacidad - sold;
                throw new RuntimeException("Error: Aforo completo del evento alcanzado. Solo quedan "
                        + (cuposRestantes > 0 ? cuposRestantes : 0) + " entradas disponibles.");
            }

            // ── Precio dinámico de preventa ─────────────────────────────────────
            // Las primeras 'cantidadPreventa' entradas se cobran a 'precioPreventa';
            // a partir de ahí, a 'precio' regular. Una compra que cruce el límite
            // se factura mezclada (parte preventa + parte regular) para que el total
            // que llega a la pasarela sea siempre exacto.
            if (evento.getPrecioPreventa() != null && evento.getCantidadPreventa() != null
                    && evento.getCantidadPreventa() > 0) {
                double precioPreventa = evento.getPrecioPreventa().doubleValue();
                int cupoPreventa = evento.getCantidadPreventa();
                int preventaRestante = Math.max(0, cupoPreventa - sold);
                int enPreventa = Math.min(cantidad, preventaRestante);
                int enRegular = cantidad - enPreventa;
                subtotal = (enPreventa * precioPreventa) + (enRegular * price);
            } else {
                subtotal = cantidad * price;
            }
        } else {
            subtotal = cantidad * price;
        }

        double descuento = 0.0;
        boolean promoParcheAplicada = false;
        String couponUsed = request.getCodigoCupon() != null ? request.getCodigoCupon().trim().toUpperCase() : "";

        if (!couponUsed.isEmpty()) {
            com.dopaminacrew.backend.model.Cupon cupon = cuponRepository.findByCodigoIgnoreCase(couponUsed)
                    .orElseThrow(() -> new RuntimeException("El cupón '" + couponUsed + "' no existe."));
            
            if (!cupon.getActivo()) {
                throw new RuntimeException("El cupón '" + couponUsed + "' no está activo o ya venció.");
            }

            // Validar un único uso por usuario
            long usosPrevios = compraRepository.countByUsuarioIdAndCodigoCupon(user.getId(), cupon.getCodigo());
            if (usosPrevios > 0) {
                throw new RuntimeException("Ya has usado el cupón '" + cupon.getCodigo() + "' en una compra anterior.");
            }

            // Validar límite global de usos totales (por ejemplo, para ganadores de sorteos)
            if (cupon.getMaxUsos() != null && cupon.getMaxUsos() > 0) {
                long usosTotales = compraRepository.countTotalUsagesOfCoupon(cupon.getCodigo());
                if (usosTotales >= cupon.getMaxUsos()) {
                    throw new RuntimeException("El cupón '" + cupon.getCodigo() + "' ya no está disponible (alcanzó su límite máximo de usos).");
                }
            }

            // Validar mínimo de boletas requeridas
            if (cupon.getMinBoletas() != null && cantidad < cupon.getMinBoletas()) {
                throw new RuntimeException("El cupón '" + cupon.getCodigo() + "' requiere la compra de mínimo " + cupon.getMinBoletas() + " boletas.");
            }
            
            descuento = subtotal * (cupon.getDescuentoPorcentaje() / 100.0);
        } else if (cantidad >= 4 && !compraRepository.usuarioYaUsoPromoParche(user.getId())) {
            // Descuento automático del 10% por cantidad (promo parche), sin cupón.
            // Es de un solo uso por usuario: una vez consumida queda deshabilitada.
            descuento = subtotal * 0.10;
            promoParcheAplicada = true;
        }

        double total = subtotal - descuento;

        Compra compra = new Compra();
        compra.setUsuario(user);
        compra.setEvento(evento);
        compra.setCantidad(cantidad);
        compra.setSubtotal(subtotal);
        compra.setDescuento(descuento);
        compra.setTotal(total);
        compra.setCodigoCupon(couponUsed.isEmpty() ? null : couponUsed.toUpperCase());
        compra.setPromoParcheAplicada(promoParcheAplicada);
        compra.setEstado("PENDIENTE"); // Pending payment via Efipay

        // Generate a unique purchase reference QR code
        String purchaseRef = "DOPAMINA-ORDER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis();
        compra.setCodigoQr(purchaseRef);

        Compra savedCompra = compraRepository.save(compra);
        return savedCompra;
    }

    @Override
    @Transactional
    public void confirmCompra(Long compraId) {
        Compra compra = compraRepository.findById(compraId)
                .orElseThrow(() -> new RuntimeException("Error: Compra no encontrada."));

        long boletasCount = boletaRepository.countByCompraId(compraId);

        // Idempotente: si ya está PAGADO y con boletas generadas, no hay nada que hacer.
        if ("PAGADO".equals(compra.getEstado()) && boletasCount > 0) {
            return;
        }
        // No reactivar compras rechazadas por la pasarela.
        if ("RECHAZADO".equals(compra.getEstado())) {
            return;
        }
        // PENDIENTE o EXPIRADO (pago que llegó tarde, tras vencer la reserva) → se confirma:
        // el pago real de la pasarela manda sobre nuestra expiración interna.

        compra.setEstado("PAGADO");
        compraRepository.save(compra);

        long existingCount = boletaRepository.countByCompraId(compraId);
        int nextSorteo = 1;
        if (compra.getEvento() != null) {
            Integer maxSorteo = boletaRepository.findMaxNumeroSorteoByEventoId(compra.getEvento().getId());
            nextSorteo = (maxSorteo != null ? maxSorteo : 0) + 1;
        }

        for (int i = (int) existingCount; i < compra.getCantidad(); i++) {
            Boleta boleta = new Boleta();
            boleta.setCompra(compra);
            boleta.setUsuario(compra.getUsuario());
            String ticketRef = "DOPAMINA-QR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() + "-" + (i + 1);
            boleta.setCodigoQr(ticketRef);
            boleta.setEstado("ACTIVA");
            boleta.setNumeroSorteo(nextSorteo++);
            boletaRepository.save(boleta);
        }

        emailService.sendPurchaseConfirmation(compra);
    }

    @Override
    public List<Compra> getMisBoletas(Long userId) {
        return compraRepository.findByUsuarioIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public boolean isPromoParcheDisponible(Long userId) {
        return !compraRepository.usuarioYaUsoPromoParche(userId);
    }
}
