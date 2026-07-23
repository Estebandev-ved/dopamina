-- =====================================================================
-- Dopamina Crew — Agregar tabla de Gastos por Evento
-- Ejecutar en phpMyAdmin sobre la base de datos dopamina_crew_db
-- =====================================================================

USE `dopamina_crew_db`;

CREATE TABLE IF NOT EXISTS `gastos_evento` (
    `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
    `evento_id`   BIGINT NOT NULL,
    `item`        VARCHAR(200) NOT NULL,
    `valor_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `pagado`      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `estado`      VARCHAR(20) NOT NULL DEFAULT 'Pendiente' COMMENT 'Pagado, Abono, Pendiente, N/A',
    `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_gastos_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_gastos_evento_id` ON `gastos_evento`(`evento_id`);
