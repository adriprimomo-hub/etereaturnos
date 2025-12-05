import { resolveAppUrl } from "@/lib/url"
import { sanitizePhoneNumber } from "@/lib/whatsapp"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

const defaultTemplate = `Hola {cliente}!

Te compartimos los detalles de tu turno:

- Fecha: {fecha}
- Hora: {hora}
- Servicio: {servicio}
- Duración: {duracion} minutos

Confirma tu asistencia aquí:
{link}

¡Gracias!`

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url)
    const segments = url.pathname.split("/").filter(Boolean)
    const idx = segments.indexOf("turnos")
    const idFromPath = idx >= 0 ? segments[idx + 1] : undefined
    const turnoId = params?.id || idFromPath

    if (!turnoId) {
      return NextResponse.json({ error: "Falta id de turno" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              /* ignore */
            }
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener turno con datos del cliente y servicio
    const { data: turno, error: turnoError } = await supabase
      .from("turnos")
      .select(`
        id,
        usuario_id,
        fecha_inicio,
        duracion_minutos,
        estado,
        confirmacion_estado,
        cliente_id,
        servicio_id,
        clientes (nombre, apellido, telefono),
        servicios (nombre)
      `)
      .eq("id", turnoId)
      .eq("usuario_id", user.id)
      .single()

    if (turnoError || !turno) {
      return NextResponse.json({ error: turnoError?.message || "Turno no encontrado" }, { status: 404 })
    }

    if (turno.confirmacion_estado === "confirmado" || turno.confirmacion_estado === "cancelado") {
      return NextResponse.json(
        { error: "El turno ya fue respondido", estado: turno.confirmacion_estado },
        { status: 409 },
      )
    }

    const { data: existingToken } = await supabase
      .from("confirmation_tokens")
      .select("token, estado")
      .eq("turno_id", turno.id)
      .eq("estado", "pendiente")
      .order("creado_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Generar token único para la confirmación y guardarlo
    const token = existingToken?.token ?? uuidv4()
    const tokenRow =
      existingToken ||
      (
        await supabase
          .from("confirmation_tokens")
          .insert({
            turno_id: turno.id,
            token,
          })
          .select("token")
          .maybeSingle()
      ).data

    if (!tokenRow) {
      console.error("[send-whatsapp] No se pudo guardar token")
      return NextResponse.json({ error: "No se pudo generar el token de confirmación" }, { status: 500 })
    }

    // Construir mensaje con variables
    const fecha = new Date(turno.fecha_inicio)
    const fechaFormato = fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    const horaFormato = fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const { data: config } = await supabase
      .from("usuarios")
      .select("telefono_whatsapp")
      .eq("id", user.id)
      .single()

    const plantillaRaw = (config?.telefono_whatsapp || "").trim()
    const plantilla = plantillaRaw && !/^[+\d\s-]+$/.test(plantillaRaw) ? plantillaRaw : defaultTemplate

    const confirmarUrl = `${resolveAppUrl({ headers: req.headers, fallbackOrigin: req.nextUrl.origin })}/confirmar/${tokenRow.token}`
    const vars: Record<string, string> = {
      cliente: `${turno.clientes?.nombre || ""} ${turno.clientes?.apellido || ""}`.trim(),
      servicio: turno.servicios?.nombre || "",
      fecha: fechaFormato,
      hora: horaFormato,
      duracion: String(turno.duracion_minutos || ""),
      link: confirmarUrl,
    }
    const mensaje = plantilla.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "")

    const clienteTelefono = sanitizePhoneNumber(((turno.clientes as any)?.telefono || "") as string)
    if (!clienteTelefono) {
      return NextResponse.json({ error: "El cliente no tiene un teléfono asociado" }, { status: 400 })
    }

    const whatsappUrl = `https://wa.me/${clienteTelefono}?text=${encodeURIComponent(mensaje)}`

    // Actualizar estado del turno
    const nextConfirmState =
      turno.confirmacion_estado === "confirmado" || turno.confirmacion_estado === "cancelado"
        ? turno.confirmacion_estado
        : "enviada"

    await supabase
      .from("turnos")
      .update({
        confirmacion_estado: nextConfirmState,
        confirmacion_enviada_at: new Date().toISOString(),
      })
      .eq("id", turnoId)

    return NextResponse.json({
      success: true,
      whatsappUrl,
      message: "Mensaje preparado para enviar",
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}

