USE `dopamina_crew_db`;

INSERT INTO `usuarios` (`nombre`, `email`, `telefono`, `password`, `rol_id`)
VALUES (
  'Administrador',
  'admin@dopaminacrew.com',
  '+573000000000',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8E3vWkxMU7ZZLA3Oyqi',
  (SELECT id FROM roles WHERE nombre = 'ROLE_ADMIN' LIMIT 1)
);
