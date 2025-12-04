import { updateSession } from "@/lib/supabase/middleware"

// Next.js proxy handler (reemplaza al middleware viejo)
export async function proxy(request) {
  return updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
}
