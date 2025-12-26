"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const currencyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

interface ClienteReporte {
  cliente: any
  estadisticas: {
    total_turnos: number
    visitas_completadas: number
    asistencia_porcentaje: number
    total_gastado: number
  }
  historial: any[]
}

interface HistorialClienteProps {
  clienteId: string
}

export function HistorialCliente({ clienteId }: HistorialClienteProps) {
  const { data: reporte } = useSWR<ClienteReporte>(`/api/reportes/clientes/${clienteId}`, fetcher)

  if (!reporte) return <div className="text-center py-8">Cargando...</div>

  const cliente = reporte.cliente
  const stats = reporte.estadisticas

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{`${cliente.nombre} ${cliente.apellido}`}</h2>
        <p className="text-muted-foreground">{cliente.telefono}</p>
        {cliente.observaciones && <p className="text-sm bg-muted p-2 rounded mt-2">{cliente.observaciones}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total_turnos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.visitas_completadas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.asistencia_porcentaje.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${formatCurrency(stats.total_gastado)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reporte.historial.map((turno) => (
                <TableRow key={turno.id}>
                  <TableCell>
                    {new Date(turno.fecha_inicio).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </TableCell>
                  <TableCell>{turno.servicios.nombre}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        turno.estado === "completado" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }
                    >
                      {turno.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
