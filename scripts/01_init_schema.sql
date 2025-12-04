-- Tablas del sistema de estética
-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  telefono_whatsapp TEXT,
  metodos_pago JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla servicios
CREATE TABLE IF NOT EXISTS servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla turnos
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  duracion_minutos INTEGER NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  asistio BOOLEAN,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  monto DECIMAL(10, 2) NOT NULL,
  metodo_pago TEXT NOT NULL,
  estado TEXT DEFAULT 'completado',
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla recordatorios enviados
CREATE TABLE IF NOT EXISTS recordatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES turnos(id) ON DELETE CASCADE,
  cliente_telefono TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  fecha_envio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_clientes_usuario ON clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_servicios_usuario ON servicios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_usuario ON turnos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_cliente ON turnos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_turno ON pagos(turno_id);
CREATE INDEX IF NOT EXISTS idx_recordatorios_turno ON recordatorios(turno_id);

-- RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordatorios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios solo acceden sus datos" ON usuarios
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Clientes solo del usuario" ON clientes
  FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Servicios solo del usuario" ON servicios
  FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Turnos solo del usuario" ON turnos
  FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Pagos solo del usuario" ON pagos
  FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Recordatorios solo del usuario" ON recordatorios
  FOR ALL USING (usuario_id = auth.uid());
