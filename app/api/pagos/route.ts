import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const turnoId = url.searchParams.get("turno_id")

  let query = supabase
    .from("pagos")
    .select(`
      *,
      turnos (cliente_id, estado, servicios(nombre, precio))
    `)
    .eq("usuario_id", user.id)

  if (turnoId) query = query.eq("turno_id", turnoId)

  const { data, error } = await query.order("fecha_pago", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { turno_id, monto, metodo_pago } = await request.json()

  // Actualizar estado del turno a "completado"
  await supabase
    .from("turnos")
    .update({ estado: "completado", updated_at: new Date() })
    .eq("id", turno_id)
    .eq("usuario_id", user.id)

  const { data, error } = await supabase
    .from("pagos")
    .insert([
      {
        usuario_id: user.id,
        turno_id,
        monto,
        metodo_pago,
        estado: "completado",
        fecha_pago: new Date().toISOString(),
      },
    ])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data[0])
}
