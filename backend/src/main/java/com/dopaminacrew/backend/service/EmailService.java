package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.ReporteSeguridad;
import com.dopaminacrew.backend.model.User;

public interface EmailService {

    void sendWelcomeEmail(User user);

    void sendPurchaseConfirmation(Compra compra);

    void sendSecurityAlert(ReporteSeguridad reporte);

    void sendRewardConfirmation(User user, String premioTitulo, String codigoCanje);

    void sendTicketTransferNotification(User origen, User destino, String boletaRef, String eventoNombre);

    void sendSuggestionReceived(String nombre, String email, String contenido);
}
