package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.CheckoutRequest;
import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.CompraRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.security.UserPrincipal;
import com.dopaminacrew.backend.service.CompraService;
import com.dopaminacrew.backend.service.EfipayService;
import com.dopaminacrew.backend.service.EfipayService.EfipayPaymentResult;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
public class EfipayController {

    @Autowired
    private EfipayService efipayService;

    @Autowired
    private CompraService compraService;

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/api/pagos/efipay/generate")
    public ResponseEntity<?> generatePayment(@Valid @RequestBody CheckoutRequest checkoutRequest,
                                              @AuthenticationPrincipal UserPrincipal currentUser,
                                              BindingResult bindingResult) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("No autorizado. Inicie sesión."));
        }
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(errors);
        }

        try {
            Compra compra = compraService.processCheckout(checkoutRequest, currentUser.getId());

            Optional<User> userOpt = userRepository.findById(currentUser.getId());
            User user = userOpt.orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            EfipayPaymentResult paymentResult = efipayService.generatePayment(compra, user);

            if (paymentResult.saved && paymentResult.paymentId != null) {
                compra.setEfipayPaymentId(paymentResult.paymentId);
                compra.setEfipayStatus("PENDIENTE");
                compraRepository.save(compra);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("compraId", compra.getId());
            response.put("saved", paymentResult.saved);
            response.put("paymentId", paymentResult.paymentId);

            if (paymentResult.isRedirect()) {
                response.put("redirectUrl", paymentResult.url);
                response.put("checkoutType", "redirect");
            } else {
                response.put("checkoutType", "api");
                response.put("token", paymentResult.token);
            }

            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(new MessageResponse("Error al comunicarse con la pasarela de pago: " + ex.getMessage()));
        }
    }

    @PostMapping("/api/webhook/efipay")
    public ResponseEntity<?> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader("Signature") String signature) {

        boolean valid = efipayService.verifyWebhookSignature(signature, rawBody);
        if (!valid) {
            return ResponseEntity.status(401).body(new MessageResponse("Firma inválida"));
        }

        try {
            JsonNode json = new com.fasterxml.jackson.databind.ObjectMapper().readTree(rawBody);
            JsonNode transaction = json.get("transaction");
            if (transaction == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("Payload inválido: no se encontró transaction"));
            }

            String status = transaction.has("status") ? transaction.get("status").asText() : "";

            Compra compra = null;

            JsonNode checkout = json.get("checkout");
            if (checkout != null) {
                String paymentRefId = checkout.has("payment_referenceable_id") ? checkout.get("payment_referenceable_id").asText() : null;
                if (paymentRefId != null) {
                    compra = compraRepository.findByEfipayPaymentId(paymentRefId);
                }

                if (compra == null) {
                    JsonNode paymentGateway = checkout.get("payment_gateway");
                    if (paymentGateway != null) {
                        JsonNode advancedOption = paymentGateway.get("advanced_option");
                        if (advancedOption != null && advancedOption.has("references")) {
                            for (JsonNode ref : advancedOption.get("references")) {
                                String refText = ref.asText();
                                if (refText.startsWith("DOPAMINA-")) {
                                    Long compraId = Long.parseLong(refText.substring("DOPAMINA-".length()));
                                    compra = compraRepository.findById(compraId).orElse(null);
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            if (compra == null) {
                return ResponseEntity.ok(new MessageResponse("Compra no encontrada para este pago, se ignorará"));
            }

            compra.setEfipayStatus(status);

            switch (status.toLowerCase()) {
                case "aprobada":
                    compraService.confirmCompra(compra.getId());
                    break;
                case "rechazada":
                case "fallida":
                case "rejected":
                    compra.setEstado("RECHAZADO");
                    break;
                default:
                    compra.setEstado("PENDIENTE");
                    break;
            }

            compraRepository.save(compra);

            return ResponseEntity.ok(new MessageResponse("Webhook procesado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error procesando webhook: " + e.getMessage()));
        }
    }

    @GetMapping("/api/pagos/efipay/status/{compraId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Long compraId,
                                               @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("No autorizado."));
        }

        Optional<Compra> compraOpt = compraRepository.findById(compraId);
        if (compraOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Compra no encontrada."));
        }

        Compra compra = compraOpt.get();
        if (!compra.getUsuario().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("No tienes acceso a esta compra."));
        }

        // Si el estado sigue PENDIENTE en BD, intentamos verificarlo en tiempo real
        if ("PENDIENTE".equals(compra.getEstado())) {
            try {
                if (efipayService.getAccessToken() != null && !efipayService.getAccessToken().trim().isEmpty()) {
                    if (compra.getEfipayPaymentId() != null) {
                        JsonNode paymentDetails = efipayService.getPaymentStatus(compra.getEfipayPaymentId());
                        if (paymentDetails != null) {
                            JsonNode transaction = paymentDetails.get("transaction");
                            String status = null;
                            if (transaction != null && transaction.has("status")) {
                                status = transaction.get("status").asText();
                            } else if (paymentDetails.has("status")) {
                                status = paymentDetails.get("status").asText();
                            } else if (paymentDetails.has("estado")) {
                                status = paymentDetails.get("estado").asText();
                            }

                            if (status != null) {
                                compra.setEfipayStatus(status);
                                switch (status.toLowerCase()) {
                                    case "aprobada":
                                    case "aprobado":
                                    case "pagado":
                                    case "success":
                                        compraService.confirmCompra(compra.getId());
                                        break;
                                    case "rechazada":
                                    case "fallida":
                                    case "rejected":
                                    case "failed":
                                        compra.setEstado("RECHAZADO");
                                        break;
                                }
                                compraRepository.save(compra);
                            }
                        }
                    }
                } else {
                    // MOCK MODE: Si no hay token de Efipay configurado (desarrollo local sin credenciales),
                    // auto-aprobamos la compra para permitir pruebas completas en local.
                    compra.setEfipayStatus("APROBADA");
                    compraService.confirmCompra(compra.getId());
                    compraRepository.save(compra);
                }
            } catch (Exception e) {
                System.err.println("Error verificando estado del pago en Efipay: " + e.getMessage());
                // Si la llamada al API falla pero estamos en desarrollo local (localhost), auto-aprobamos
                String redirectUrl = efipayService.getRedirectBaseUrl();
                if (redirectUrl != null && (redirectUrl.contains("localhost") || redirectUrl.contains("127.0.0.1"))) {
                    System.out.println("Dev Mode: Fallback de auto-aprobación activado tras error en pasarela");
                    compra.setEfipayStatus("APROBADA");
                    compraService.confirmCompra(compra.getId());
                    compraRepository.save(compra);
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("compraId", compra.getId());
        response.put("estado", compra.getEstado());
        response.put("efipayStatus", compra.getEfipayStatus());
        response.put("efipayPaymentId", compra.getEfipayPaymentId());
        return ResponseEntity.ok(response);
    }

    /**
     * Permite a un administrador o subadministrador verificar el estado de un pago en tiempo real.
     * Si el pago fue aprobado, confirma la compra y envía los correos.
     */
    @GetMapping("/api/admin/pagos/efipay/status/{compraId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUBADMIN')")
    public ResponseEntity<?> adminGetPaymentStatus(@PathVariable Long compraId) {
        Optional<Compra> compraOpt = compraRepository.findById(compraId);
        if (compraOpt.isEmpty()) {
            return ResponseEntity.status(404).body(new MessageResponse("Compra no encontrada."));
        }

        Compra compra = compraOpt.get();
        if ("PENDIENTE".equals(compra.getEstado())) {
            try {
                if (efipayService.getAccessToken() != null && !efipayService.getAccessToken().trim().isEmpty()) {
                    if (compra.getEfipayPaymentId() != null) {
                        JsonNode paymentDetails = efipayService.getPaymentStatus(compra.getEfipayPaymentId());
                        if (paymentDetails != null) {
                            JsonNode transaction = paymentDetails.get("transaction");
                            String status = null;
                            if (transaction != null && transaction.has("status")) {
                                status = transaction.get("status").asText();
                            } else if (paymentDetails.has("status")) {
                                status = paymentDetails.get("status").asText();
                            } else if (paymentDetails.has("estado")) {
                                status = paymentDetails.get("estado").asText();
                            }

                            if (status != null) {
                                compra.setEfipayStatus(status);
                                switch (status.toLowerCase()) {
                                    case "aprobada":
                                    case "aprobado":
                                    case "pagado":
                                    case "success":
                                        compraService.confirmCompra(compra.getId());
                                        break;
                                    case "rechazada":
                                    case "fallida":
                                    case "rejected":
                                    case "failed":
                                        compra.setEstado("RECHAZADO");
                                        break;
                                }
                                compraRepository.save(compra);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error verificando estado del pago en Efipay por Admin: " + e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("compraId", compra.getId());
        response.put("estado", compra.getEstado());
        response.put("efipayStatus", compra.getEfipayStatus());
        response.put("efipayPaymentId", compra.getEfipayPaymentId());
        return ResponseEntity.ok(response);
    }
}
