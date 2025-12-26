import type { SupabaseClient } from "@supabase/supabase-js"

type TurnoRow = {
  id: string
  fecha_inicio: string
  fecha_fin: string | null
  duracion_minutos: number | null
}

/**
 * Marca como completados los turnos pendientes cuyo horario ya finalizo.
 * Devuelve los ids actualizados para poder depurar o invalidar caches.
 */
export async function closeExpiredTurnos(supabase: SupabaseClient, userId: string) {
  const now = new Date()
  const nowIso = now.toISOString()

  const { data: pendientes, error } = await supabase
    .from("turnos")
    .select("id, fecha_inicio, fecha_fin, duracion_minutos")
    .eq("usuario_id", userId)
    .eq("estado", "pendiente")
    .lte("fecha_inicio", nowIso)

  if (error) {
    console.error("[turnos] No se pudo leer turnos pendientes", error)
    return []
  }

  const vencidos = (pendientes || []).filter((turno) => {
    const inicio = new Date(turno.fecha_inicio)
    const fin =
      turno.fecha_fin && !Number.isNaN(new Date(turno.fecha_fin).getTime())
        ? new Date(turno.fecha_fin)
        : new Date(inicio.getTime() + (turno.duracion_minutos || 0) * 60000)

    return fin.getTime() <= now.getTime()
  })

  if (!vencidos.length) return []

  const updates = vencidos.map((turno: TurnoRow) => ({
    id: turno.id,
    estado: "completado",
    fecha_fin:
      turno.fecha_fin && !Number.isNaN(new Date(turno.fecha_fin).getTime())
        ? turno.fecha_fin
        : new Date(new Date(turno.fecha_inicio).getTime() + (turno.duracion_minutos || 0) * 60000).toISOString(),
    updated_at: nowIso,
  }))

  const results = await Promise.allSettled(
    updates.map((update) =>
      supabase
        .from("turnos")
        .update({
          estado: update.estado,
          fecha_fin: update.fecha_fin,
          updated_at: update.updated_at,
        })
        .eq("id", update.id)
        .eq("usuario_id", userId)
        .select("id")
        .single(),
    ),
  )

  const updatedIds: string[] = []

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      if (result.value.error) {
        console.error("[turnos] No se pudieron cerrar turnos vencidos", result.value.error)
        return
      }
      if (result.value.data?.id) {
        updatedIds.push(result.value.data.id)
      }
      return
    }

    console.error("[turnos] No se pudieron cerrar turnos vencidos", {
      error: result.reason,
      turnoId: updates[index]?.id,
    })
  })

  return updatedIds
}
