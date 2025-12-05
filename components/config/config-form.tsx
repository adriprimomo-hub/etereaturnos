"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon, SaveIcon } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Usuario {
  id: string
  email: string
  telefono_whatsapp?: string | null // reutilizado como plantilla configurable
  metodos_pago: string[]
}

const defaultTemplate =
  "Hola {cliente}!\n\nTe esperamos para tu turno de {servicio} el {fecha} a las {hora}.\n\nConfirma aquí: {link}"

export function ConfigForm() {
  const { theme, setTheme } = useTheme()
  const { data: config, mutate } = useSWR<Usuario>("/api/config", fetcher)
  const [mensaje, setMensaje] = useState(defaultTemplate)
  const [metodosPago, setMetodosPago] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<string>("system")
  const [mounted, setMounted] = useState(false)
  const themeOptions = [
    { value: "system", label: "Igual al sistema" },
    { value: "light", label: "Claro" },
    { value: "dark", label: "Oscuro" },
  ]

  useEffect(() => {
    if (config) {
      setMensaje(config.telefono_whatsapp || defaultTemplate)
      const allowed = ["efectivo", "tarjeta", "transferencia"]
      const mapped = (config.metodos_pago || []).map((m) =>
        m.startsWith("tarjeta") ? "tarjeta" : m,
      )
      const filtered = Array.from(new Set(mapped.filter((m) => allowed.includes(m))))
      setMetodosPago(filtered)
    }
  }, [config])

  useEffect(() => {
    if (theme) {
      setSelectedTheme(theme)
    }
    setMounted(true)
  }, [theme])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefono_whatsapp: mensaje,
          metodos_pago: metodosPago,
        }),
      })

      if (res.ok) {
        mutate()
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value)
    setTheme(value as "light" | "dark" | "system")
  }

  const toggleMetodoPago = (metodo: string) => {
    setMetodosPago((prev) => (prev.includes(metodo) ? prev.filter((m) => m !== metodo) : [...prev, metodo]))
  }

  const metodos_disponibles = ["efectivo", "tarjeta", "transferencia"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <CardDescription>Elige el modo de color de la aplicacion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mounted ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {themeOptions.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={selectedTheme === opt.value ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => handleThemeChange(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Cargando preferencias de tema...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensaje de confirmación</CardTitle>
          <CardDescription>Personaliza el texto que se abrirá en WhatsApp al confirmar un turno.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Plantilla</label>
            <Textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={5}
              placeholder={defaultTemplate}
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles: {`{cliente}`} {`{servicio}`} {`{fecha}`} {`{hora}`} {`{duracion}`} {`{link}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>Selecciona los métodos de pago disponibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {metodos_disponibles.map((metodo) => (
            <div key={metodo} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={metodo}
                checked={metodosPago.includes(metodo)}
                onChange={() => toggleMetodoPago(metodo)}
                className="rounded border-border"
              />
              <label htmlFor={metodo} className="text-sm font-medium cursor-pointer capitalize">
                {metodo.replace(/_/g, " ")}
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
          <CardDescription>Información de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{config?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 gap-2" size="lg">
        {loading ? (
          <>
            <Loader2Icon className="h-5 w-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <SaveIcon className="h-5 w-5" />
            Guardar cambios
          </>
        )}
      </Button>
    </div>
  )
}

