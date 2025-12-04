-- Script para inicializar usuario después del signup
-- Este se ejecutaría automáticamente al crear un usuario vía Auth
-- Por ahora puede ejecutarse manualmente

INSERT INTO usuarios (id, email, created_at)
SELECT id, email, NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM usuarios)
ON CONFLICT DO NOTHING;
