import { resolveAppUrl } from "@/lib/url"
import { createClient } from "@/lib/supabase/server"
import { sanitizePhoneNumber } from "@/lib/whatsapp"

const TIME_ZONE = "America/Argentina/Buenos_Aires"

const defaultTemplate = `Hola {cliente}!

Te compartimos los detalles de tu turno:

- Fecha: {fecha}
- Hora: {hora}
- Servicio: {servicio}
- Duración: {duracion} minutos

Confirma tu asistencia aquí:
{link}

¡Gracias!`

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const { turnoId } = await request.json()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      return Response.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener turno con cliente/servicio
    const { data: turno, error: turnoError } = await supabase
      .from("turnos")
      .select(
        "*, clientes:cliente_id(nombre, apellido, telefono), servicios:servicio_id(nombre, duracion_minutos, precio)",
      )
      .eq("id", turnoId || params.id)
      .eq("usuario_id", user.id)
      .single()

    if (turnoError || !turno) {
      return Response.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    if (turno.confirmacion_estado === "confirmado" || turno.confirmacion_estado === "cancelado") {
      return Response.json(
        { error: "El turno ya fue respondido", estado: turno.confirmacion_estado },
        { status: 409 },
      )
    }

    const { data: config } = await supabase
      .from("usuarios")
      .select("telefono_whatsapp")
      .eq("id", user.id)
      .single()

    const plantillaRaw = (config?.telefono_whatsapp || "").trim()
    const plantilla = plantillaRaw && !/^[+\d\s-]+$/.test(plantillaRaw) ? plantillaRaw : defaultTemplate

    const { data: existingToken } = await supabase
      .from("confirmation_tokens")
      .select("token, estado")
      .eq("turno_id", turno.id)
      .eq("estado", "pendiente")
      .order("creado_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Crear token de confirmación si no hay uno pendiente
    const tokenData =
      existingToken ||
      (
        await supabase
          .from("confirmation_tokens")
          .insert({
            turno_id: turno.id,
            token: Math.random().toString(36).substring(7),
          })
          .select("token")
          .maybeSingle()
      ).data

    if (!tokenData) {
      console.error("[confirm-whatsapp] No se pudo guardar token")
      return Response.json({ error: "No se pudo generar el token de confirmación" }, { status: 500 })
    }

    const fecha = new Date(turno.fecha_inicio)
    const fechaStr = fecha.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: TIME_ZONE,
    })
    const horaStr = fecha.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIME_ZONE,
    })

    const confirmLink = `${resolveAppUrl({
      headers: request.headers,
      fallbackOrigin: new URL(request.url).origin,
    })}/confirmar/${tokenData.token}`
    const vars: Record<string, string> = {
      cliente: turno.clientes?.nombre || "",
      servicio: turno.servicios?.nombre || "",
      fecha: fechaStr,
      hora: horaStr,
      duracion: String(turno.duracion_minutos || ""),
      link: confirmLink,
    }
    const mensaje = plantilla.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "")

    const clienteTelefono = sanitizePhoneNumber(turno.clientes?.telefono || "")
    if (!clienteTelefono) {
      return Response.json({ error: "El cliente no tiene un teléfono asociado" }, { status: 400 })
    }

    // URL encode y crear link WhatsApp
    const textEncoded = encodeURIComponent(mensaje)
    const whatsappLink = `https://wa.me/${clienteTelefono}?text=${textEncoded}`

    // Actualizar estado de turno
    await supabase
      .from("turnos")
      .update({
        confirmacion_estado: "enviada",
        confirmacion_enviada_at: new Date().toISOString(),
      })
      .eq("id", turno.id)

    return Response.json({
      whatsappLink,
      mensaje,
    })
  } catch (error) {
    console.error("[v0] Error en confirm-whatsapp:", error)
    return Response.json({ error: "Error interno" }, { status: 500 })
  }
}
