-- =====================================================================
-- Dopamina Crew — Agregar tabla de Eventos
-- Ejecutar en phpMyAdmin sobre la base de datos dopamina_crew_db
-- =====================================================================

USE `dopamina_crew_db`;

CREATE TABLE IF NOT EXISTS `eventos` (
    `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
    `nombre`      VARCHAR(150) NOT NULL,
    `descripcion` TEXT,
    `fecha`       DATE NOT NULL,
    `hora`        TIME NOT NULL,
    `lugar`       VARCHAR(200) NOT NULL,
    `ciudad`      VARCHAR(100) NOT NULL DEFAULT 'Medellín',
    `precio`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `capacidad`   INT NOT NULL DEFAULT 100,
    `imagen_url`  VARCHAR(500),
    `lineup`      TEXT,
    `activo`      TINYINT(1) NOT NULL DEFAULT 1,
    `destacado`   TINYINT(1) NOT NULL DEFAULT 0,
    `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
