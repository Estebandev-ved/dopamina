-- =====================================================================
-- Dopamina Crew — Tabla de Reclamo de Items de Combo
-- Rastrea si los items incluidos en un combo (botellas, vapes, etc.)
-- fueron entregados físicamente en el evento.
-- =====================================================================

USE `dopamina_crew_db`;

CREATE TABLE IF NOT EXISTS `combo_item_claims` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `compra_id` BIGINT NOT NULL,
    `item_nombre` VARCHAR(255) NOT NULL,
    `reclamado` TINYINT(1) NOT NULL DEFAULT 0,
    `reclamado_por_nombre` VARCHAR(100) DEFAULT NULL,
    `reclamado_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uq_compra_item` (`compra_id`, `item_nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
