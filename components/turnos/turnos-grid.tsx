"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { TurnoForm } from "./turno-form"
import { TurnoCard } from "./turno-card"
import type { Cliente } from "../clientes/clientes-list"
import type { Servicio } from "../servicios/servicios-list"

const fetcher = async <T,>(url: string): Promise<T[]> => {
  const res = await fetch(url)
  const data = await res.json()

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data

  console.warn("Respuesta inesperada del endpoint", url, data)
  return []
}

const confirmacionBadge: Record<string, string> = {
  no_enviada: "bg-gray-100 text-gray-700",
  enviada: "bg-blue-100 text-blue-800",
  confirmado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-rose-100 text-rose-800",
}

const confirmacionLabel: Record<string, string> = {
  no_enviada: "Sin confirmar",
  enviada: "Confirmacion enviada",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
}

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")

const toDateKey = (date: Date) => date.toISOString().split("T")[0]

const SLOT_MINUTES = 30
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 20
const SLOT_HEIGHT = 48

const getWeekStart = (date: Date) => {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = (day + 6) % 7
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - diff)
  return copy
}

const addDays = (date: Date, amount: number) => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

const formatWeekRange = (start: Date) => {
  const end = addDays(start, 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  const startLabel = start.toLocaleDateString("es-AR", {
    day: "numeric",
    month: sameMonth ? "long" : "short",
  })

  const endLabel = end.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  })

  return sameYear ? `${startLabel} - ${endLabel} ${start.getFullYear()}` : `${startLabel} ${start.getFullYear()} - ${endLabel}`
}

const getTurnoDuration = (turno: Turno) => turno.duracion_minutos || turno.servicios?.duracion_minutos || 30

export interface Turno {
  id: string
  cliente_id: string
  servicio_id: string
  fecha_inicio: string
  fecha_fin: string
  duracion_minutos: number
  estado: string
  asistio: boolean | null
  observaciones: string | null
  confirmacion_estado?: string | null
  confirmacion_enviada_at?: string | null
  clientes: { nombre: string; apellido: string; telefono: string }
  servicios: { nombre: string; precio: number; duracion_minutos: number }
}

export function TurnosGrid() {
  const { data: turnos = [], mutate } = useSWR<Turno[]>("/api/turnos", fetcher)
  const { data: clientes = [] } = useSWR<Cliente[]>("/api/clientes", fetcher)
  const { data: servicios = [] } = useSWR<Servicio[]>("/api/servicios", fetcher)

  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [filterFecha, setFilterFecha] = useState("")
  const [filterEstado, setFilterEstado] = useState("all")
  const [filterCliente, setFilterCliente] = useState("all")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedTurnoId, setSelectedTurnoId] = useState<string | null>(null)

  const weekEnd = useMemo(() => addDays(currentWeekStart, 7), [currentWeekStart])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index)), [currentWeekStart])
  const weekLabel = useMemo(() => formatWeekRange(currentWeekStart), [currentWeekStart])
  const todayKey = toDateKey(new Date())

  const selectedTurno = useMemo(
    () => (selectedTurnoId ? turnos.find((t) => t.id === selectedTurnoId) || null : null),
    [selectedTurnoId, turnos],
  )

  const visibleTurnos = useMemo(() => {
    return turnos
      .filter((t) => {
        const fechaInicio = new Date(t.fecha_inicio)
        const matchWeek = fechaInicio >= currentWeekStart && fechaInicio < weekEnd
        if (!matchWeek) return false
        const matchSearch =
          `${t.clientes.nombre} ${t.clientes.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
          t.servicios.nombre.toLowerCase().includes(search.toLowerCase())
        const matchFecha = !filterFecha || toDateKey(fechaInicio) === filterFecha
        const matchEstado = filterEstado === "all" || t.estado === filterEstado
        const matchCliente = filterCliente === "all" || t.cliente_id === filterCliente

        return matchSearch && matchFecha && matchEstado && matchCliente
      })
      .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
  }, [turnos, search, filterFecha, filterEstado, filterCliente, currentWeekStart, weekEnd])

  const calendarRange = useMemo(() => {
    if (!visibleTurnos.length) {
      return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR }
    }
    let minMinutes = Infinity
    let maxMinutes = -Infinity

    visibleTurnos.forEach((turno) => {
      const fecha = new Date(turno.fecha_inicio)
      const startMinutes = fecha.getHours() * 60 + fecha.getMinutes()
      const duration = getTurnoDuration(turno)
      minMinutes = Math.min(minMinutes, startMinutes)
      maxMinutes = Math.max(maxMinutes, startMinutes + duration)
    })

    if (!Number.isFinite(minMinutes) || !Number.isFinite(maxMinutes)) {
      return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR }
    }

    const startHour = Math.min(DEFAULT_START_HOUR, Math.floor(minMinutes / 60))
    const endHour = Math.max(DEFAULT_END_HOUR, Math.ceil(maxMinutes / 60))

    return {
      startHour,
      endHour: endHour <= startHour ? startHour + 2 : endHour,
    }
  }, [visibleTurnos])

  const slots = useMemo(() => {
    const totalMinutes = (calendarRange.endHour - calendarRange.startHour) * 60
    const slotCount = Math.max(1, Math.ceil(totalMinutes / SLOT_MINUTES))

    return Array.from({ length: slotCount }, (_, index) => {
      const minutes = calendarRange.startHour * 60 + index * SLOT_MINUTES
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return {
        label: `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`,
        showLabel: mins === 0,
      }
    })
  }, [calendarRange])

  const calendarHeight = slots.length * SLOT_HEIGHT

  const groupedByDay = useMemo(() => {
    const groups: Record<string, Turno[]> = {}
    visibleTurnos.forEach((turno) => {
      const key = toDateKey(new Date(turno.fecha_inicio))
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(turno)
    })
    return groups
  }, [visibleTurnos])

  const handleDateChange = (value: string) => {
    setFilterFecha(value)
    if (value) {
      setCurrentWeekStart(getWeekStart(new Date(value)))
    }
  }

  const handleShiftWeek = (offset: number) => {
    setCurrentWeekStart((prev) => getWeekStart(addDays(prev, offset * 7)))
  }

  const handleGoToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()))
    setFilterFecha("")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Cancelar turno?")) return
    await fetch(`/api/turnos/${id}`, { method: "DELETE" })
    mutate()
    if (selectedTurnoId === id) {
      setSelectedTurnoId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Turnos</h2>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? (
            <>
              <XIcon className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Nuevo turno
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <TurnoForm
              clientes={clientes || []}
              servicios={servicios || []}
              onSuccess={() => {
                mutate()
                setShowForm(false)
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="rounded-3xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Semana</p>
            <p className="text-lg font-semibold">{weekLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleShiftWeek(-1)} aria-label="Semana anterior">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleShiftWeek(1)} aria-label="Semana siguiente">
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={handleGoToday} className="gap-2">
              <CalendarDaysIcon className="h-4 w-4" />
              Hoy
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto border-t">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[100px_repeat(7,minmax(0,1fr))] border-b bg-muted/30 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="px-3 py-4 text-left">Todo el día</div>
              {weekDays.map((day) => {
                const dayKey = toDateKey(day)
                const isToday = dayKey === todayKey
                const isSelectedDay = !!filterFecha && filterFecha === dayKey
                return (
                  <div
                    key={`head-${dayKey}`}
                    className={cn(
                      "border-l px-3 py-2 text-foreground",
                      (isToday || isSelectedDay) && "bg-white text-rose-700 shadow-inner ring-1 ring-rose-200",
                    )}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {day.toLocaleDateString("es-AR", { weekday: "short" })}
                    </p>
                    <p className="text-lg font-bold leading-none">{day.getDate()}</p>
                    <p className="text-[11px] text-muted-foreground">{day.toLocaleDateString("es-AR", { month: "short" })}</p>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-[100px_repeat(7,minmax(0,1fr))]">
              <div className="bg-muted/20">
                {slots.map((slot, index) => (
                  <div
                    key={`time-${slot.label}-${index}`}
                    className={cn(
                      "flex items-center justify-end pr-3 text-[11px] text-muted-foreground",
                      index === 0 && "border-t",
                      "border-b border-dashed border-muted/50",
                    )}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  >
                    {slot.showLabel ? <span className="font-semibold">{slot.label}</span> : <span className="opacity-0">.</span>}
                  </div>
                ))}
              </div>
              {weekDays.map((day) => {
                const dayKey = toDateKey(day)
                const dayTurnos = groupedByDay[dayKey] || []
                const isToday = dayKey === todayKey
                const isSelectedDay = !!filterFecha && filterFecha === dayKey

                return (
                  <div
                    key={`col-${dayKey}`}
                    className={cn(
                      "relative border-l",
                      (isToday || isSelectedDay) && "bg-rose-50/40",
                      "transition-colors",
                    )}
                    style={{ height: `${calendarHeight}px` }}
                  >
                    <div className="absolute inset-0">
                      {slots.map((_, idx) => (
                        <div
                          key={`grid-${dayKey}-${idx}`}
                          className="border-b border-dashed border-muted/50"
                          style={{ height: `${SLOT_HEIGHT}px` }}
                        />
                      ))}
                    </div>
                    <div className="relative h-full">
                      {dayTurnos.length === 0 && (
                        <p className="absolute left-2 top-2 text-[11px] text-muted-foreground/70">Sin turnos</p>
                      )}
                      {dayTurnos.map((turno, index) => {
                        const fecha = new Date(turno.fecha_inicio)
                        const duration = getTurnoDuration(turno)
                        const startMinutes = fecha.getHours() * 60 + fecha.getMinutes()
                        const startSlotRaw = (startMinutes - calendarRange.startHour * 60) / SLOT_MINUTES
                        const clampedStart = Math.min(Math.max(0, startSlotRaw), slots.length - 0.5)
                        const durationSlotsRaw = Math.max(duration / SLOT_MINUTES, 0.5)
                        const clampedDuration = Math.min(durationSlotsRaw, slots.length - clampedStart)
                        const top = clampedStart * SLOT_HEIGHT
                        const minHeight = SLOT_HEIGHT * 1.6
                        const height = Math.max(minHeight, clampedDuration * SLOT_HEIGHT - 6)
                        const horaInicio = fecha.toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                        const horaFin = new Date(fecha.getTime() + duration * 60000).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                        const confirmState = turno.confirmacion_estado || "no_enviada"

                        return (
                          <button
                            key={turno.id}
                            type="button"
                            onClick={() => setSelectedTurnoId(turno.id)}
                            className="absolute left-1 right-1 rounded-xl border bg-white/95 p-2 text-left shadow-sm transition hover:border-rose-200 hover:bg-rose-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-300"
                            style={{ top: `${top}px`, height: `${height}px`, minHeight: `${minHeight}px`, zIndex: 10 + index }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-semibold leading-4 text-rose-700">
                              <span>
                                {horaInicio} - {horaFin}
                              </span>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize whitespace-nowrap",
                                  confirmacionBadge[confirmState] ?? "bg-secondary text-secondary-foreground",
                                )}
                              >
                                {confirmacionLabel[confirmState] ?? formatLabel(confirmState)}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-sm font-semibold leading-tight">
                              {turno.clientes.nombre} {turno.clientes.apellido}
                            </p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{turno.servicios.nombre}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={!!selectedTurnoId} onOpenChange={(open) => !open && setSelectedTurnoId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {selectedTurno && (
            <div className="flex h-full flex-col gap-4 overflow-y-auto pb-6">
              <SheetHeader>
                <SheetTitle>Detalle del turno</SheetTitle>
              </SheetHeader>
              <div className="px-4">
                <TurnoCard
                  turno={selectedTurno}
                  onDelete={handleDelete}
                  onRefresh={mutate}
                  clientes={clientes || []}
                  servicios={servicios || []}
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
