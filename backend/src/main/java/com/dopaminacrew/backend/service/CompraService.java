package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.dto.CheckoutRequest;
import com.dopaminacrew.backend.model.Compra;
import java.util.List;

/**
 * Service interface handling ticket checkout business rules.
 */
public interface CompraService {
    
    Compra processCheckout(CheckoutRequest request, Long userId);

    void confirmCompra(Long compraId);

    List<Compra> getMisBoletas(Long userId);

    /** Indica si el usuario aún puede usar la promo de "10% por 4+ boletas". */
    boolean isPromoParcheDisponible(Long userId);
}
