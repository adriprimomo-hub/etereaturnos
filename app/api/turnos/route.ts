import { createClient } from "@/lib/supabase/server"
import { closeExpiredTurnos } from "@/lib/turnos"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const fechaInicio = url.searchParams.get("fecha_inicio")
  const fechaFin = url.searchParams.get("fecha_fin")
  const clienteId = url.searchParams.get("cliente_id")
  const estado = url.searchParams.get("estado")

  await closeExpiredTurnos(supabase, user.id)

  let query = supabase
    .from("turnos")
    .select(`
      *,
      clientes:cliente_id (nombre, apellido, telefono),
      servicios:servicio_id (nombre, precio, duracion_minutos)
    `)
    .eq("usuario_id", user.id)

  if (fechaInicio) query = query.gte("fecha_inicio", fechaInicio)
  if (fechaFin) query = query.lte("fecha_inicio", fechaFin)
  if (clienteId) query = query.eq("cliente_id", clienteId)
  if (estado) query = query.eq("estado", estado)

  const { data, error } = await query.order("fecha_inicio", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { cliente_id, servicio_id, fecha_inicio, duracion_minutos, observaciones } = await request.json()

  const fechaInicioDate = new Date(fecha_inicio)
  const fecha_fin = new Date(fechaInicioDate.getTime() + duracion_minutos * 60000).toISOString()

  const { data: overlapping, error: overlapError } = await supabase
    .from("turnos")
    .select("id, fecha_inicio, fecha_fin")
    .eq("usuario_id", user.id)
    .lt("fecha_inicio", fecha_fin)
    .gt("fecha_fin", fechaInicioDate.toISOString())

  if (overlapError) {
    return NextResponse.json({ error: overlapError.message }, { status: 500 })
  }

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json(
      { error: "Ya existe un turno asignado en ese horario. Ajusta la fecha y hora para evitar superposiciones." },
      { status: 409 },
    )
  }

  const { data, error } = await supabase
    .from("turnos")
    .insert([
      {
        usuario_id: user.id,
        cliente_id,
        servicio_id,
        fecha_inicio,
        fecha_fin,
        duracion_minutos,
        estado: "pendiente",
        observaciones,
      },
    ])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
