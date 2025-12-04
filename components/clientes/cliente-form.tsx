"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Cliente } from "./clientes-list"

interface ClienteFormProps {
  cliente?: Cliente | null
  onSuccess: () => void
}

export function ClienteForm({ cliente, onSuccess }: ClienteFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    observaciones: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cliente) {
      setFormData(cliente)
    }
  }, [cliente])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = cliente ? `/api/clientes/${cliente.id}` : "/api/clientes"
      const method = cliente ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        onSuccess()
        setFormData({ nombre: "", apellido: "", telefono: "", observaciones: "" })
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
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Apellido</label>
        <Input
          value={formData.apellido}
          onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Teléfono</label>
        <Input
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Observaciones</label>
        <Textarea
          value={formData.observaciones}
          onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          rows={3}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Guardando..." : cliente ? "Actualizar" : "Crear cliente"}
      </Button>
    </form>
  )
}
