"use client"

import type { FormEvent } from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { Cliente } from "../clientes/clientes-list"
import type { Servicio } from "../servicios/servicios-list"
import type { Turno } from "./turnos-grid"
import { CalendarPlusIcon, Loader2Icon, SaveIcon, SearchIcon, XIcon } from "lucide-react"

const formatForInput = (dateString: string) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

interface TurnoFormProps {
  clientes: Cliente[]
  servicios: Servicio[]
  onSuccess: () => void
  onCancel?: () => void
  turno?: Turno | null
}

export function TurnoForm({ clientes, servicios, onSuccess, onCancel, turno }: TurnoFormProps) {
  const [formData, setFormData] = useState({
    cliente_id: turno?.cliente_id || "",
    servicio_id: turno?.servicio_id || "",
    fecha_inicio: turno ? formatForInput(turno.fecha_inicio) : "",
    duracion_minutos: turno?.duracion_minutos,
    observaciones: turno?.observaciones || "",
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false)
  const [servicioSearchOpen, setServicioSearchOpen] = useState(false)

  const selectedServicio = servicios.find((s) => s.id === formData.servicio_id)
  const isEditing = Boolean(turno)
  const isFutureTurno = turno ? new Date(turno.fecha_inicio).getTime() > Date.now() : true

  useEffect(() => {
    if (turno) {
      setFormData({
        cliente_id: turno.cliente_id,
        servicio_id: turno.servicio_id,
        fecha_inicio: formatForInput(turno.fecha_inicio),
        duracion_minutos: turno.duracion_minutos,
        observaciones: turno.observaciones || "",
      })
    }
  }, [turno])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const startDate = new Date(formData.fecha_inicio)
    if (Number.isNaN(startDate.getTime())) {
      setLoading(false)
      setErrorMessage("Selecciona una fecha y hora válidas.")
      return
    }

    const payload = {
      cliente_id: formData.cliente_id,
      servicio_id: formData.servicio_id,
      fecha_inicio: startDate.toISOString(),
      duracion_minutos: Number.parseInt(formData.duracion_minutos.toString()),
      observaciones: formData.observaciones,
    }

    if (!payload.cliente_id || !payload.servicio_id || Number.isNaN(payload.duracion_minutos) || payload.duracion_minutos <= 0) {
      setLoading(false)
      setErrorMessage("Revisa los datos del cliente, servicio y duración antes de guardar.")
      return
    }

    try {
      const res = await fetch(isEditing && turno ? `/api/turnos/${turno.id}` : "/api/turnos", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        setErrorMessage(error?.error || "No se pudo guardar el turno")
        return
      }

      onSuccess()
      if (!isEditing) {
        setFormData({
          cliente_id: "",
          servicio_id: "",
          fecha_inicio: "",
          duracion_minutos: 60,
          observaciones: "",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setErrorMessage("Ocurrió un error al guardar el turno")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium">Cliente</label>
            <Dialog open={clienteSearchOpen} onOpenChange={setClienteSearchOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-md">
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle>Buscar cliente</DialogTitle>
                </DialogHeader>
                <div className="p-4 pt-0">
                  <Command>
                    <CommandInput placeholder="Escribe el nombre o teléfono..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron clientes</CommandEmpty>
                      <CommandGroup>
                        {clientes.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.nombre} ${c.apellido} ${c.telefono}`}
                            onSelect={() => {
                              setFormData((prev) => ({ ...prev, cliente_id: c.id }))
                              setClienteSearchOpen(false)
                            }}
                          >
                            <div className="flex flex-col text-left">
                              <span className="font-medium">{`${c.nombre} ${c.apellido}`}</span>
                              <span className="text-xs text-muted-foreground">{c.telefono}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Select
            value={formData.cliente_id}
            onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {`${c.nombre} ${c.apellido}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium">Servicio</label>
            <Dialog open={servicioSearchOpen} onOpenChange={setServicioSearchOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-md">
                <DialogHeader className="px-6 pt-6">
                  <DialogTitle>Buscar servicio</DialogTitle>
                </DialogHeader>
                <div className="p-4 pt-0">
                  <Command>
                    <CommandInput placeholder="Nombre del servicio..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron servicios</CommandEmpty>
                      <CommandGroup>
                        {servicios.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.nombre} ${s.duracion_minutos} ${s.precio}`}
                            onSelect={() => {
                              setFormData((prev) => ({ ...prev, servicio_id: s.id, duracion_minutos: s.duracion_minutos }))
                              setServicioSearchOpen(false)
                            }}
                          >
                            <div className="flex flex-col text-left">
                              <span className="font-medium">{s.nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {s.duracion_minutos} min · ${s.precio.toFixed(2)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Select
            value={formData.servicio_id}
            onValueChange={(value) => {
              const servicioSeleccionado = servicios.find(s => s.id === value)
          
              setFormData({
                ...formData,
                servicio_id: value,
                duracion_minutos: servicioSeleccionado?.duracion_minutos || 0,
              })
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar servicio" />
            </SelectTrigger>
            <SelectContent>
              {servicios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {`${s.nombre} (${s.duracion_minutos}min)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Fecha y Hora</label>
          <Input
            type="datetime-local"
            value={formData.fecha_inicio}
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
            step={300}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Duración (minutos)</label>
          <Input
            type="number"
            value={formData.duracion_minutos}
            onChange={(e) =>
              setFormData({
                ...formData,
                duracion_minutos: Number.isNaN(Number.parseInt(e.target.value))
                  ? 0
                  : Number.parseInt(e.target.value),
              })
            }
            placeholder={selectedServicio?.duracion_minutos.toString()}
            min={5}
            step={5}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Observaciones</label>
        <Textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          rows={3}
        />
      </div>

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {isEditing && onCancel && (
          <Button type="button" variant="outline" className="gap-2" onClick={onCancel} disabled={loading}>
            <XIcon className="h-4 w-4" />
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading || (isEditing && !isFutureTurno)} className="gap-2">
          {loading ? (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : isEditing ? (
            <>
              <SaveIcon className="h-4 w-4" />
              Guardar cambios
            </>
          ) : (
            <>
              <CalendarPlusIcon className="h-4 w-4" />
              Crear turno
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
