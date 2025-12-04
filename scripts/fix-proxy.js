import { writeFileSync } from "node:fs"
import { join } from "node:path"

const target = join(process.cwd(), "proxy.js")

const content = `import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request) {
  return updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\\\.svg$).*)"],
}
`

writeFileSync(target, content, "utf8")
console.log("[fix-proxy] proxy.js actualizado")
