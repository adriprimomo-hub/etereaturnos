import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Esta función se ejecutaría por un cron job externo (Vercel Cron, AWS Lambda, etc.)
// Por ahora, se puede llamar manualmente desde el admin
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Obtener turnos para mañana
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const manana = new Date(hoy)
  manana.setDate(manana.getDate() + 1)
  const mananaFin = new Date(manana)
  mananaFin.setHours(23, 59, 59, 999)

  const { data: turnos, error } = await supabase
    .from("turnos")
    .select(`
      id,
      fecha_inicio,
      clientes(nombre, apellido, telefono),
      servicios(nombre)
    `)
    .eq("usuario_id", user.id)
    .eq("estado", "pendiente")
    .gte("fecha_inicio", manana.toISOString())
    .lte("fecha_inicio", mananaFin.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aquí iría la integración real con la API de WhatsApp/recordatorios
  // Por ahora simulamos que se envían
  const recordatoriosInsert =
    turnos?.map((turno: any) => ({
      usuario_id: user.id,
      turno_id: turno.id,
      cliente_telefono: turno.clientes.telefono,
      estado: "pendiente",
    })) || []

  if (recordatoriosInsert.length > 0) {
    await supabase.from("recordatorios").insert(recordatoriosInsert)
  }

  return NextResponse.json({
    mensaje: `${recordatoriosInsert.length} recordatorios programados para mañana`,
    enviados: recordatoriosInsert.length,
    turnos: turnos,
  })
}
