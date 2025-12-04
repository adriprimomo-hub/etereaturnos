-- Agregar columna de estado de confirmación a turnos
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS confirmacion_estado TEXT DEFAULT 'no_enviada';
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS confirmacion_enviada_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS confirmacion_confirmada_at TIMESTAMP WITH TIME ZONE;

-- Crear tabla de tokens públicos para confirmación
CREATE TABLE IF NOT EXISTS confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  estado TEXT DEFAULT 'pendiente',
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  confirmado_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_turno ON confirmation_tokens(turno_id);
CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_token ON confirmation_tokens(token);
