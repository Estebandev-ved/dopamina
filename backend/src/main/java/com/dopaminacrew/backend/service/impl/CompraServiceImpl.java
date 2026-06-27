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
import com.dopaminacrew.backend.service.CompraService;
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
    private static final String DISCOUNT_COUPON = "DOPAMINA10";

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private BoletaRepository boletaRepository;

    @Override
    @Transactional
    public Compra processCheckout(CheckoutRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado."));

        int cantidad = request.getCantidad();
        
        // Retrieve event if provided to determine pricing
        Evento evento = null;
        double price = DEFAULT_TICKET_PRICE;
        
        if (request.getEventoId() != null) {
            evento = eventoRepository.findById(request.getEventoId())
                    .orElseThrow(() -> new RuntimeException("Error: Evento no encontrado."));
            
            // Calculate pricing phases based on total tickets sold for this event
            Integer sold = compraRepository.sumCantidadByEventoId(evento.getId());
            if (sold == null) sold = 0;
            
            // Limit event capacity to 1000 tickets
            if (sold + cantidad > 1000) {
                int cuposRestantes = 1000 - sold;
                throw new RuntimeException("Error: Aforo completo del evento alcanzado. Solo quedan " 
                        + (cuposRestantes > 0 ? cuposRestantes : 0) + " entradas disponibles.");
            }
            
            // Apply tiers: first 100 tickets at 25,000 COP, rest up to 1000 at 35,000 COP
            if (sold >= 100) {
                price = 35000.0; // Phase 2
            } else {
                price = 25000.0; // Phase 1
            }
        }

        double subtotal = cantidad * price;
        double descuento = 0.0;
        String couponUsed = request.getCodigoCupon() != null ? request.getCodigoCupon().trim() : "";

        // Apply 10% discount if purchasing 4+ tickets OR using the correct coupon
        if (cantidad >= 4 || couponUsed.equalsIgnoreCase(DISCOUNT_COUPON)) {
            descuento = subtotal * 0.10;
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
        compra.setEstado("PAGADO"); // Simulated successful payment

        // Generate a unique purchase reference QR code
        String purchaseRef = "DOPAMINA-ORDER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis();
        compra.setCodigoQr(purchaseRef);

        Compra savedCompra = compraRepository.save(compra);

        // Generate individual tickets (Boleta) with unique QR codes for each entry
        for (int i = 0; i < cantidad; i++) {
            Boleta boleta = new Boleta();
            boleta.setCompra(savedCompra);
            // unique QR code for each ticket
            String ticketRef = "DOPAMINA-QR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis() + "-" + (i + 1);
            boleta.setCodigoQr(ticketRef);
            boleta.setEstado("ACTIVA");
            boletaRepository.save(boleta);
        }

        return savedCompra;
    }

    @Override
    public List<Compra> getMisBoletas(Long userId) {
        return compraRepository.findByUsuarioIdOrderByCreatedAtDesc(userId);
    }
}
