import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { id } = await params

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { nombre, apellido, telefono, observaciones } = await request.json()

  const { data, error } = await supabase
    .from("clientes")
    .update({ nombre, apellido, telefono, observaciones, updated_at: new Date() })
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

  const { error } = await supabase.from("clientes").delete().eq("id", id).eq("usuario_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
