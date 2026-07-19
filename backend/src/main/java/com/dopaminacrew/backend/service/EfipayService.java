package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.util.Base64;

@Service
public class EfipayService {

    private final String apiUrl;
    private final String accessToken;
    private final String officeId;
    private final String webhookToken;
    private final String commerceId;
    private final String checkoutTemplateId;
    private final String redirectBaseUrl;
    private final String backendBaseUrl;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public EfipayService(
            @Value("${efipay.api-url}") String apiUrl,
            @Value("${efipay.access-token}") String accessToken,
            @Value("${efipay.office-id}") String officeId,
            @Value("${efipay.webhook-token}") String webhookToken,
            @Value("${efipay.commerce-id}") String commerceId,
            @Value("${efipay.checkout-template-id}") String checkoutTemplateId,
            @Value("${efipay.redirect-base-url}") String redirectBaseUrl,
            @Value("${efipay.backend-base-url}") String backendBaseUrl,
            @Value("${spring.profiles.active:dev}") String activeProfile) {
        this.apiUrl = apiUrl;
        this.accessToken = accessToken;
        this.officeId = officeId;
        this.webhookToken = webhookToken;
        this.commerceId = commerceId;
        this.checkoutTemplateId = checkoutTemplateId;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();

        // Auto-detección de entorno:
        // Si el perfil es "dev" → siempre forzar localhost (ignorar el .env)
        // Si el perfil es "prod" → usar las URLs del .env tal cual
        boolean isDevProfile = "dev".equals(activeProfile);

        if (isDevProfile) {
            this.redirectBaseUrl = "http://localhost:5173";
            this.backendBaseUrl = "http://localhost:8080";
            System.out.println("[EfipayService] Modo DEV detectado — URLs de redirección forzadas a localhost");
            System.out.println("[EfipayService]   Frontend: http://localhost:5173");
            System.out.println("[EfipayService]   Backend:  http://localhost:8080");
        } else {
            this.redirectBaseUrl = redirectBaseUrl;
            this.backendBaseUrl = backendBaseUrl;
            System.out.println("[EfipayService] Modo PROD — URLs de redirección: " + redirectBaseUrl);
        }
    }

    public static class EfipayPaymentResult {
        public boolean saved;
        public String paymentId;
        public String url;
        public String token;

        public boolean isRedirect() { return url != null && !url.isEmpty(); }
    }

    public EfipayPaymentResult generatePayment(Compra compra, User user) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + accessToken);

        ObjectNode paymentNode = objectMapper.createObjectNode();
        paymentNode.put("description", "Compra entradas Dopamina Crew - Orden " + compra.getId());
        paymentNode.put("amount", compra.getTotal().doubleValue());
        paymentNode.put("currency_type", "COP");
        paymentNode.put("checkout_type", "redirect");
        if (checkoutTemplateId != null && !checkoutTemplateId.isEmpty()) {
            paymentNode.put("checkout_template_id", checkoutTemplateId);
        }

        ObjectNode advancedOptions = objectMapper.createObjectNode();
        advancedOptions.put("has_comments", false);

        String compraRef = "DOPAMINA-" + compra.getId();
        advancedOptions.putArray("references").add(compraRef);

        ObjectNode resultUrls = objectMapper.createObjectNode();
        String frontendBase = redirectBaseUrl;
        String backendBase = backendBaseUrl;
        resultUrls.put("approved", frontendBase + "/pago-resultado?estado=aprobado&compraId=" + compra.getId());
        resultUrls.put("rejected", frontendBase + "/pago-resultado?estado=rechazado&compraId=" + compra.getId());
        resultUrls.put("pending", frontendBase + "/pago-resultado?estado=pendiente&compraId=" + compra.getId());
        resultUrls.put("webhook", backendBase + "/api/webhook/efipay");
        advancedOptions.set("result_urls", resultUrls);

        ObjectNode root = objectMapper.createObjectNode();
        root.set("payment", paymentNode);
        root.set("advanced_options", advancedOptions);
        root.put("office", Integer.parseInt(officeId));

        String requestBody = objectMapper.writeValueAsString(root);

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl + "/payment/generate-payment",
                HttpMethod.POST,
                entity,
                String.class);

        JsonNode json = objectMapper.readTree(response.getBody());

        EfipayPaymentResult result = new EfipayPaymentResult();
        result.saved = json.has("saved") && json.get("saved").asBoolean();
        result.paymentId = json.has("payment_id") ? json.get("payment_id").asText() : null;
        result.url = json.has("url") ? json.get("url").asText() : null;
        result.token = json.has("token") ? json.get("token").asText() : null;
        return result;
    }

    public JsonNode getPaymentStatus(String paymentId) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl + "/payment/status/" + paymentId,
                HttpMethod.GET,
                entity,
                String.class);

        return objectMapper.readTree(response.getBody());
    }

    public boolean verifyWebhookSignature(String signature, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(webhookToken.getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(payload.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b));
            }
            String expectedSignature = sb.toString();
            return MessageDigest.isEqual(expectedSignature.getBytes(), signature.getBytes());
        } catch (Exception e) {
            return false;
        }
    }

    public String getAccessToken() {
        return this.accessToken;
    }

    public String getRedirectBaseUrl() {
        return this.redirectBaseUrl;
    }
}
