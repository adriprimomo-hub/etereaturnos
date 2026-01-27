"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ClienteForm } from "./cliente-form"
import { ClienteHistorialModal } from "./cliente-historial"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PencilIcon, Trash2Icon, UserPlusIcon, XIcon } from "lucide-react"
import { sortClientes } from "@/lib/clientes"

const fetcher = async (url: string): Promise<Cliente[]> => {
  const res = await fetch(url)
  const data = await res.json()

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data

  console.warn("Respuesta inesperada del endpoint", url, data)
  return []
}

export interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono: string
  observaciones: string | null
}

export function ClientesList() {
  const { data: clientes = [], mutate } = useSWR<Cliente[]>("/api/clientes", fetcher)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  const orderedClientes = useMemo(() => sortClientes(clientes), [clientes])
  const filtered = useMemo(
    () => orderedClientes.filter((c) => `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase())),
    [orderedClientes, search],
  )

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar cliente?")) return
    await fetch(`/api/clientes/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? (
            <>
              <XIcon className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <UserPlusIcon className="h-4 w-4" />
              Nuevo cliente
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <ClienteForm
              cliente={selectedCliente}
              onSuccess={() => {
                mutate()
                setShowForm(false)
                setSelectedCliente(null)
              }}
            />
          </CardContent>
        </Card>
      )}

      <div>
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{`${cliente.nombre} ${cliente.apellido}`}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cliente.observaciones}</TableCell>
                  <TableCell className="space-x-2 flex flex-wrap">
                    <ClienteHistorialModal
                      clienteId={cliente.id}
                      nombreCliente={`${cliente.nombre} ${cliente.apellido}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCliente(cliente)
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
                      onClick={() => handleDelete(cliente.id)}
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
