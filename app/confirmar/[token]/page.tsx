"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDaysIcon, Clock3Icon, SparklesIcon, UserIcon } from "lucide-react"

interface TurnoInfo {
  id: string
  cliente: string
  servicio: string
  fecha: string
  duracion: number
  token: string
  estado: string
}

export default function ConfirmacionPage() {
  const params = useParams()
  const token = params.token as string
  const [turno, setTurno] = useState<TurnoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchTurno = async () => {
      try {
        const res = await fetch(`/api/confirmacion/${token}`)
        const data = await res.json()
        if (data.turno) {
          setTurno(data.turno)
          if (data.turno.estado !== "pendiente") {
            setConfirmado(data.turno.estado === "confirmado")
          }
        }
      } catch (error) {
        console.error("[v0] Error fetchTurno:", error)
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchTurno()
  }, [token])

  const handleConfirmar = async (confirm: boolean) => {
    setEnviando(true)
    try {
      const res = await fetch(`/api/confirmacion/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmado: confirm }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data?.estado) {
          setConfirmado(data.estado === "confirmado")
        }
        alert(data?.error || "No se pudo confirmar el turno")
        return
      }
      if (data.success) {
        setConfirmado(confirm)
      }
    } catch (error) {
      console.error("[v0] Error handleConfirmar:", error)
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-rose-50 via-rose-100/60 to-rose-50 p-4 sm:p-6">
        <div className="w-full max-w-xl rounded-2xl bg-white/70 backdrop-blur-sm border border-rose-100 shadow-lg px-6 py-8">
          <p className="text-center text-rose-600 font-medium">Cargando tu turno...</p>
        </div>
      </div>
    )
  }

  if (!turno) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-rose-50 via-rose-100/60 to-rose-50 p-4 sm:p-6">
        <div className="w-full max-w-xl rounded-2xl bg-white/80 backdrop-blur-sm border border-rose-100 shadow-lg px-6 py-8">
          <p className="text-center text-rose-700 text-base sm:text-lg font-medium">Token inválido o expirado</p>
        </div>
      </div>
    )
  }

  const fecha = new Date(turno.fecha)
  const fechaStr = fecha.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const horaStr = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })

  const estadoBadge: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    confirmado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-rose-50 via-rose-100/60 to-rose-50 p-4 sm:p-6">
      <Card className="w-full max-w-2xl shadow-xl border border-rose-100 bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-rose-100">
          <div className="flex items-center justify-center gap-2 text-rose-700 px-2">
            <SparklesIcon className="h-5 w-5" />
            <CardTitle className="text-center text-lg sm:text-xl font-semibold tracking-tight">
              Confirmación de turno
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-7 pt-4 sm:pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm font-medium text-rose-500 uppercase tracking-wide">Servicio</p>
              <p className="text-base sm:text-lg font-semibold text-rose-900">{turno.servicio}</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-xs sm:text-sm font-medium text-rose-500 uppercase tracking-wide">Fecha y hora</p>
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm sm:text-base">
                  <CalendarDaysIcon className="h-4 w-4 text-rose-500" />
                  <span className="capitalize">{fechaStr}</span>
                </div>
                <div className="flex items-center gap-2 text-rose-700 text-base sm:text-lg font-semibold">
                  <Clock3Icon className="h-4 w-4 text-rose-500" />
                  <span>{horaStr}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm font-medium text-rose-500 uppercase tracking-wide">Duración</p>
              <p className="text-base sm:text-lg font-semibold text-rose-900">{turno.duracion} minutos</p>
            </div>
            {confirmado !== null && (
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm font-medium text-rose-500 uppercase tracking-wide">Estado</p>
                <Badge className={`${estadoBadge[confirmado ? "confirmado" : "cancelado"]} px-3 py-1 rounded-full`}>
                  {confirmado ? "Confirmado" : "Cancelado"}
                </Badge>
              </div>
            )}
          </div>

          {confirmado === null && (
            <div className="flex gap-3 pt-2 sm:pt-4 flex-col sm:flex-row">
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-sm sm:text-base shadow-sm"
                onClick={() => handleConfirmar(true)}
                disabled={enviando}
              >
                {enviando ? "Confirmando..." : "Confirmar asistencia"}
              </Button>
              <Button
                className="flex-1 border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 text-sm sm:text-base"
                variant="outline"
                onClick={() => handleConfirmar(false)}
                disabled={enviando}
              >
                {enviando ? "Cancelando..." : "No puedo asistir"}
              </Button>
            </div>
          )}

          {confirmado !== null && (
            <div className="text-center text-sm sm:text-base text-rose-700 pt-1 sm:pt-2 font-medium">
              {confirmado ? "¡Gracias por confirmar tu turno!" : "Tu turno ha sido cancelado."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
