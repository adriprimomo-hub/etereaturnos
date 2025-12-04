import { Poppins, Inter } from "next/font/google"

export const font_sans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

export const font_mono = Inter({
  subsets: ["latin"],
  variable: "--font-mono",
})
