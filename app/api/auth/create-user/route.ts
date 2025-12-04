import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { user_id, email } = await request.json()

    if (!user_id || !email) {
      return NextResponse.json({ error: "Missing user_id or email" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("usuarios").upsert(
      [
        {
          id: user_id,
          email: email,
        },
      ],
      { onConflict: "id" },
    )

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error in create-user route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
