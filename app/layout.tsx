import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"
import { font_sans } from "./fonts"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Eterea Turnos",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${font_sans.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
