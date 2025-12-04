import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { id } = await params

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const updates = await request.json()
  const { data: currentTurno, error: currentError } = await supabase
    .from("turnos")
    .select("*")
    .eq("id", id)
    .eq("usuario_id", user.id)
    .single()

  if (currentError || !currentTurno) {
    return NextResponse.json({ error: currentError?.message || "Turno no encontrado" }, { status: 404 })
  }

  const updatedFechaInicio = updates.fecha_inicio || currentTurno.fecha_inicio
  const updatedDuracion = updates.duracion_minutos || currentTurno.duracion_minutos
  const fechaInicioDate = new Date(updatedFechaInicio)
  const fecha_fin = new Date(fechaInicioDate.getTime() + updatedDuracion * 60000).toISOString()

  const { data: overlapping, error: overlapError } = await supabase
    .from("turnos")
    .select("id")
    .eq("usuario_id", user.id)
    .neq("id", id)
    .lt("fecha_inicio", fecha_fin)
    .gt("fecha_fin", fechaInicioDate.toISOString())

  if (overlapError) {
    return NextResponse.json({ error: overlapError.message }, { status: 500 })
  }

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json(
      { error: "Este turno se superpone con otro existente. Ajusta la fecha y hora antes de guardar." },
      { status: 409 },
    )
  }

  updates.fecha_inicio = fechaInicioDate.toISOString()
  updates.duracion_minutos = updatedDuracion
  updates.fecha_fin = fecha_fin

  const { data, error } = await supabase
    .from("turnos")
    .update({ ...updates, updated_at: new Date() })
    .eq("id", id)
    .eq("usuario_id", user.id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { id } = await params

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase.from("turnos").delete().eq("id", id).eq("usuario_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
