import { supabaseAdmin } from "@/lib/supabase/admin"

const extractToken = (paramsToken: string | undefined, url: URL) => {
  const raw = paramsToken ?? url.pathname.split("/").filter(Boolean).pop() ?? ""
  const decoded = (() => {
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  })()

  // Intenta extraer la porción que parece un UUID (solo letras, números y guiones).
  const candidate = decoded.match(/[0-9A-Za-z-]{20,}/)?.[0] ?? decoded
  const normalized = candidate.trim().replace(/[^A-Za-z0-9-]/g, "")

  return { raw, token: normalized }
}

export async function GET(request: Request, { params }: { params: { token: string } }) {
  try {
    const url = new URL(request.url)
    const { token, raw } = extractToken(params?.token, url)

    if (!token) {
      console.error("[confirmacion] Token faltante en GET", {
        pathname: url.pathname,
        search: url.search,
        rawToken: raw,
      })
      return Response.json({ error: "Token requerido" }, { status: 400 })
    }

    // Obtener token y turno
    const { data: confirmation, error } = await supabaseAdmin
      .from("confirmation_tokens")
      .select(
        "*, turnos:turno_id(*, clientes:cliente_id(nombre, apellido), servicios:servicio_id(nombre, duracion_minutos))",
      )
      .eq("token", token)
      .maybeSingle()

    if (error) {
      console.error("[confirmacion] Error obteniendo token:", error)
      return Response.json({ error: "No se pudo validar el token" }, { status: 500 })
    }

    if (!confirmation) {
      console.error("[confirmacion] Token no encontrado", {
        tokenRaw: raw,
        tokenNormalized: token,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      })
      return Response.json({ error: "Token invalido o expirado" }, { status: 404 })
    }

    const turno = confirmation.turnos
    return Response.json({
      turno: {
        id: turno.id,
        cliente: turno.clientes.nombre + " " + turno.clientes.apellido,
        servicio: turno.servicios.nombre,
        fecha: turno.fecha_inicio,
        duracion: turno.servicios.duracion_minutos,
        token,
        estado: confirmation.estado,
      },
    })
  } catch (error) {
    console.error("[v0] Error en GET confirmacion:", error)
    return Response.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  try {
    const url = new URL(request.url)
    const { token, raw } = extractToken(params?.token, url)

    if (!token) {
      console.error("[confirmacion] Token faltante en POST", {
        pathname: url.pathname,
        search: url.search,
        rawToken: raw,
      })
      return Response.json({ error: "Token requerido" }, { status: 400 })
    }

    const { confirmado } = await request.json()
    // Obtener confirmacion
    const { data: confirmation, error } = await supabaseAdmin
      .from("confirmation_tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle()

    if (error) {
      console.error("[confirmacion] Error leyendo token:", error)
      return Response.json({ error: "No se pudo validar el token" }, { status: 500 })
    }

    if (!confirmation) {
      console.error("[confirmacion] Token no encontrado en POST", {
        tokenRaw: raw,
        tokenNormalized: token,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      })
      return Response.json({ error: "Token invalido o expirado" }, { status: 404 })
    }

    if (confirmation.estado && confirmation.estado !== "pendiente") {
      return Response.json(
        { error: "Este turno ya fue respondido", estado: confirmation.estado },
        { status: 409 },
      )
    }

    // Actualizar estado
    const nuevoEstado = confirmado ? "confirmado" : "cancelado"
    await supabaseAdmin
      .from("confirmation_tokens")
      .update({
        estado: nuevoEstado,
        confirmado_at: new Date().toISOString(),
      })
      .eq("token", token)

    // Marcar cualquier otro token pendiente del mismo turno como resuelto
    await supabaseAdmin
      .from("confirmation_tokens")
      .update({
        estado: nuevoEstado,
        confirmado_at: new Date().toISOString(),
      })
      .eq("turno_id", confirmation.turno_id)
      .eq("estado", "pendiente")

    await supabaseAdmin
      .from("turnos")
      .update({
        confirmacion_estado: nuevoEstado,
        confirmacion_confirmada_at: new Date().toISOString(),
      })
      .eq("id", confirmation.turno_id)

    return Response.json({ success: true, estado: nuevoEstado })
  } catch (error) {
    console.error("[v0] Error en POST confirmacion:", error)
    return Response.json({ error: "Error interno" }, { status: 500 })
  }
}

