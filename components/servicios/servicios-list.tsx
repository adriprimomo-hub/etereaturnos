"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ServicioForm } from "./servicio-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export interface Servicio {
  id: string
  nombre: string
  duracion_minutos: number
  precio: number
  activo: boolean
}

export function ServiciosList() {
  const { data: servicios, mutate } = useSWR<Servicio[]>("/api/servicios", fetcher)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null)

  const filtered = servicios?.filter((s) => s.nombre.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar servicio?")) return
    await fetch(`/api/servicios/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Servicios</h2>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? (
            <>
              <XIcon className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Nuevo servicio
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <ServicioForm
              servicio={selectedServicio}
              onSuccess={() => {
                mutate()
                setShowForm(false)
                setSelectedServicio(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      <div>
        <Input
          placeholder="Buscar servicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell className="font-medium">{servicio.nombre}</TableCell>
                  <TableCell>{servicio.duracion_minutos} min</TableCell>
                  <TableCell>${servicio.precio.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        servicio.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {servicio.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedServicio(servicio)
                        setShowForm(true)
                      }}
                      className="gap-1.5"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(servicio.id)}
                      className="gap-1.5"
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
