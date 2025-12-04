"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Servicio } from "./servicios-list"

interface ServicioFormProps {
  servicio?: Servicio | null
  onSuccess: () => void
}

export function ServicioForm({ servicio, onSuccess }: ServicioFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    duracion_minutos: 60,
    precio: 0,
    activo: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (servicio) {
      setFormData(servicio)
    }
  }, [servicio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = servicio ? `/api/servicios/${servicio.id}` : "/api/servicios"
      const method = servicio ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onSuccess()
        setFormData({ nombre: "", duracion_minutos: 60, precio: 0, activo: true })
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre del Servicio</label>
        <Input
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Duración (minutos)</label>
          <Input
            type="number"
            value={formData.duracion_minutos}
            onChange={(e) => setFormData({ ...formData, duracion_minutos: Number.parseInt(e.target.value) })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Precio</label>
          <Input
            type="number"
            step="0.01"
            value={formData.precio}
            onChange={(e) => setFormData({ ...formData, precio: Number.parseFloat(e.target.value) })}
            required
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="activo"
          checked={formData.activo}
          onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
          className="rounded border-border"
        />
        <label htmlFor="activo" className="text-sm font-medium cursor-pointer">
          Activo
        </label>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Guardando..." : servicio ? "Actualizar" : "Crear servicio"}
      </Button>
    </form>
  )
}
