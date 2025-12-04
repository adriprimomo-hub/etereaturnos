import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const periodo = url.searchParams.get("periodo") || "30" // días
  const dias = Number.parseInt(periodo)
  const fechaInicio = new Date()
  fechaInicio.setDate(fechaInicio.getDate() - dias)

  const { data, error } = await supabase
    .from("turnos")
    .select(`
      servicio_id,
      estado,
      servicios(id, nombre, precio)
    `)
    .eq("usuario_id", user.id)
    .eq("estado", "completado")
    .gte("created_at", fechaInicio.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Agrupar por servicio
  const reporteMap = new Map<string, any>()
  data?.forEach((turno: any) => {
    const key = turno.servicio_id
    if (!reporteMap.has(key)) {
      reporteMap.set(key, {
        servicio_id: key,
        nombre: turno.servicios.nombre,
        precio: turno.servicios.precio,
        cantidad: 0,
        ingresos: 0,
      })
    }
    const item = reporteMap.get(key)
    item.cantidad += 1
    item.ingresos += turno.servicios.precio
  })

  const reporte = Array.from(reporteMap.values()).sort((a, b) => b.cantidad - a.cantidad)

  return NextResponse.json({
    periodo: `${dias} días`,
    total_servicios: reporte.reduce((sum, s) => sum + s.cantidad, 0),
    ingresos_totales: reporte.reduce((sum, s) => sum + s.ingresos, 0),
    servicios: reporte,
  })
}
