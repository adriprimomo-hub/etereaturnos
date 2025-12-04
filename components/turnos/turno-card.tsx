"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Turno } from "./turnos-grid"
import type { Cliente } from "../clientes/clientes-list"
import type { Servicio } from "../servicios/servicios-list"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CerrarTurnoModal } from "../pagos/cerrar-turno-modal"
import { TurnoForm } from "./turno-form"
import { useState } from "react"
import { BanIcon, Loader2Icon, MessageCircleIcon, PencilIcon, PlayIcon } from "lucide-react"

interface TurnoCardProps {
  turno: Turno
  onDelete: (id: string) => void
  onRefresh: () => void
  clientes: Cliente[]
  servicios: Servicio[]
}

export function TurnoCard({ turno, onDelete, onRefresh, clientes, servicios }: TurnoCardProps) {
  const [loading, setLoading] = useState(false)
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const fecha = new Date(turno.fecha_inicio)
  const hora = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  const fecha_str = fecha.toLocaleDateString("es-AR")
  const isFutureTurno = fecha.getTime() > Date.now()
  const canManageConfirmation =
    turno.estado === "pendiente" && isFutureTurno && turno.confirmacion_estado !== "confirmado"

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      await fetch(`/api/turnos/${turno.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newStatus }),
      })
      onRefresh()
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarWhatsapp = async () => {
    const pendingWindow = typeof window !== "undefined" ? window.open("", "_blank") : null
    setEnviandoWhatsapp(true)
    try {
      const res = await fetch(`/api/turnos/${turno.id}/send-whatsapp`, {
        method: "POST",
      })
      const data = await res.json()

      const whatsappLink = data.whatsappUrl || data.whatsappLink
      if (whatsappLink) {
        if (pendingWindow) {
          pendingWindow.location.href = whatsappLink
        } else {
          window.location.href = whatsappLink
        }
        setTimeout(() => {
          onRefresh()
        }, 1000)
      } else {
        pendingWindow?.close()
        alert(`Error: ${data.error || "No se pudo generar el link de WhatsApp"}`)
      }
    } catch (error) {
      pendingWindow?.close()
      console.error("[v0] Error al enviar WhatsApp:", error)
      alert("Error al enviar confirmacion")
    } finally {
      setEnviandoWhatsapp(false)
    }
  }

  const statusColors: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    en_curso: "bg-blue-100 text-blue-800",
    completado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  }

  const confirmacionBadge: Record<string, string> = {
    no_enviada: "bg-gray-100 text-gray-800",
    enviada: "bg-blue-100 text-blue-800",
    confirmado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:items-center">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg truncate">
              {turno.clientes.nombre} {turno.clientes.apellido}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{turno.servicios.nombre}</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            <Badge className={statusColors[turno.estado] || "bg-gray-100"}>{turno.estado}</Badge>
            <Badge className={confirmacionBadge[turno.confirmacion_estado || "no_enviada"]}>
              {turno.confirmacion_estado === "no_enviada" && "Sin enviar"}
              {turno.confirmacion_estado === "enviada" && "Enviada"}
              {turno.confirmacion_estado === "confirmado" && "Confirmado"}
              {turno.confirmacion_estado === "cancelado" && "Cancelado"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p className="font-medium">{hora}</p>
          <p className="text-muted-foreground text-xs sm:text-sm">{fecha_str}</p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground text-xs sm:text-sm">Duración: {turno.duracion_minutos} min</p>
          <p className="text-muted-foreground text-xs sm:text-sm">Precio: ${turno.servicios.precio.toFixed(2)}</p>
        </div>
        {turno.observaciones && (
          <div className="text-sm bg-muted p-2 rounded">
            <p className="text-muted-foreground text-xs sm:text-sm">{turno.observaciones}</p>
          </div>
        )}
        <div className="flex gap-2 flex-wrap text-xs sm:text-sm">
          {canManageConfirmation && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleEnviarWhatsapp}
              disabled={enviandoWhatsapp}
              className="text-xs bg-transparent gap-2"
            >
              {enviandoWhatsapp ? (
                <>
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  {turno.confirmacion_estado === "enviada" ? "Reenviando..." : "Enviando..."}
                </>
              ) : (
                <>
                  <MessageCircleIcon className="h-3.5 w-3.5" />
                  {turno.confirmacion_estado === "enviada" ? "Reenviar confirmación" : "Enviar confirmación"}
                </>
              )}
            </Button>
          )}
          {turno.estado === "pendiente" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("en_curso")}
              disabled={loading}
              className="text-xs gap-1.5"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              Iniciar
            </Button>
          )}
          {turno.estado === "en_curso" && <CerrarTurnoModal turno={turno} onSuccess={onRefresh} />}
          {turno.estado !== "completado" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(turno.id)}
              disabled={loading}
              className="text-xs gap-1.5"
            >
              <BanIcon className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditOpen(true)}
            className="text-xs gap-1.5"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      </CardContent>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Editar turno <span className="text-sm font-normal text-muted-foreground">({hora} · {fecha_str})</span>
            </DialogTitle>
          </DialogHeader>
          <TurnoForm
            turno={turno}
            clientes={clientes}
            servicios={servicios}
            onCancel={() => setEditOpen(false)}
            onSuccess={() => {
              setEditOpen(false)
              onRefresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
