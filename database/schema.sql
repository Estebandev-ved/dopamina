-- Database: dopamina_crew_db
-- Schema Initialization Script

CREATE DATABASE IF NOT EXISTS `dopamina_crew_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dopamina_crew_db`;

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system roles
INSERT INTO `roles` (`nombre`) VALUES ('ROLE_USER') ON DUPLICATE KEY UPDATE `nombre`=`nombre`;
INSERT INTO `roles` (`nombre`) VALUES ('ROLE_ADMIN') ON DUPLICATE KEY UPDATE `nombre`=`nombre`;

-- 2. Create Users Table (usuarios)
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `telefono` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `rol_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional index for faster query lookup by email
CREATE INDEX idx_user_email ON `usuarios` (`email`);

-- 3. Create Compras Table
CREATE TABLE IF NOT EXISTS `compras` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` BIGINT NOT NULL,
    `evento_id` BIGINT,
    `cantidad` INT NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `codigo_cupon` VARCHAR(50),
    `estado` VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    `codigo_qr` VARCHAR(255) NOT NULL UNIQUE,
    `efipay_payment_id` VARCHAR(100) DEFAULT NULL,
    `efipay_status` VARCHAR(50) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Boletas Table (individual tickets)
CREATE TABLE IF NOT EXISTS `boletas` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `compra_id` BIGINT NOT NULL,
    `codigo_qr` VARCHAR(255) NOT NULL UNIQUE,
    `estado` VARCHAR(50) NOT NULL DEFAULT 'ACTIVA', -- 'ACTIVA', 'USADA'
    `numero_sorteo` INT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create Canjes Table (reward redemptions)
CREATE TABLE IF NOT EXISTS `canjes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` BIGINT NOT NULL,
    `premio_id` VARCHAR(100) NOT NULL,
    `premio_titulo` VARCHAR(255) NOT NULL,
    `codigo_canje` VARCHAR(100) NOT NULL UNIQUE,
    `costo_puntos` INT NOT NULL,
    `estado` VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, ENTREGADO
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create Cupones Table (dynamic coupons)
CREATE TABLE IF NOT EXISTS `cupones` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `codigo` VARCHAR(50) NOT NULL UNIQUE,
    `descuento_porcentaje` DOUBLE NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    `descripcion` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default coupons
INSERT INTO `cupones` (`codigo`, `descuento_porcentaje`, `activo`, `descripcion`) 
VALUES ('DOPAMINA10', 10.0, TRUE, 'Descuento general del 10%')
ON DUPLICATE KEY UPDATE `codigo`=`codigo`;

INSERT INTO `cupones` (`codigo`, `descuento_porcentaje`, `activo`, `descripcion`) 
VALUES ('REGALO15', 15.0, TRUE, 'Cupón regalo sorpresa del 15%')
ON DUPLICATE KEY UPDATE `codigo`=`codigo`;

-- 7. Create Sugerencias Table (public song/genre suggestions)
CREATE TABLE IF NOT EXISTS `sugerencias` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `contenido` TEXT NOT NULL,
    `nombre` VARCHAR(100) DEFAULT NULL,
    `email` VARCHAR(150) DEFAULT NULL,
    `estado` VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Create Visitas_Pagina Table (page visit tracking)
CREATE TABLE IF NOT EXISTS `visitas_pagina` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `pagina` VARCHAR(255) NOT NULL,
    `titulo` VARCHAR(255) DEFAULT NULL,
    `usuario_id` BIGINT DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` VARCHAR(500) DEFAULT NULL,
    `referrer` VARCHAR(500) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_visitas_pagina ON `visitas_pagina` (`pagina`);
CREATE INDEX idx_visitas_created_at ON `visitas_pagina` (`created_at`);
CREATE INDEX idx_visitas_usuario ON `visitas_pagina` (`usuario_id`);

-- 9. Create Sets_Musicales Table (YouTube music sets/playlists)
CREATE TABLE IF NOT EXISTS `sets_musicales` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `titulo` VARCHAR(200) NOT NULL,
    `artista` VARCHAR(100) DEFAULT NULL,
    `youtube_url` VARCHAR(1000) NOT NULL,
    `genero` VARCHAR(100) DEFAULT NULL,
    `descripcion` TEXT DEFAULT NULL,
    `imagen_url` VARCHAR(2048) DEFAULT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sets_genero ON `sets_musicales` (`genero`);
CREATE INDEX idx_sets_activo ON `sets_musicales` (`activo`);


