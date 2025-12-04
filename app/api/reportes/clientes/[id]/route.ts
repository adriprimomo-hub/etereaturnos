import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { id } = await params

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Obtener info cliente
  const { data: cliente } = await supabase.from("clientes").select("*").eq("id", id).eq("usuario_id", user.id).single()

  // Obtener historial de turnos
  const { data: turnos, error } = await supabase
    .from("turnos")
    .select(`
      *,
      servicios(nombre, precio)
    `)
    .eq("cliente_id", id)
    .eq("usuario_id", user.id)
    .order("fecha_inicio", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Obtener pagos
  const { data: pagos } = await supabase
    .from("pagos")
    .select("*")
    .in("turno_id", turnos?.map((t: any) => t.id) || [])
    .eq("usuario_id", user.id)

  const totalGastado = pagos?.reduce((sum: number, p: any) => sum + p.monto, 0) || 0
  const visitasCompletadas = turnos?.filter((t: any) => t.estado === "completado").length || 0
  const asistencia =
    visitasCompletadas > 0
      ? (((turnos?.filter((t: any) => t.asistio).length || 0) / visitasCompletadas) * 100).toFixed(2)
      : "0"

  return NextResponse.json({
    cliente,
    estadisticas: {
      total_turnos: turnos?.length || 0,
      visitas_completadas: visitasCompletadas,
      asistencia_porcentaje: Number.parseFloat(asistencia as string),
      total_gastado: totalGastado,
    },
    historial: turnos,
  })
}
