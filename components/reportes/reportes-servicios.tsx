"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
const fetcher = (url: string) => fetch(url).then((res) => res.json())
const currencyFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatCurrency = (value: number) => currencyFormatter.format(value)

interface Reporte {
  periodo: string
  total_servicios: number
  ingresos_totales: number
  servicios: Array<{
    nombre: string
    cantidad: number
    precio: number
    ingresos: number
  }>
}

export function ReportesServicios() {
  const [periodo, setPeriodo] = useState("30")
  const { data: reporte } = useSWR<Reporte>(`/api/reportes/servicios?periodo=${periodo}`, fetcher)
  const servicios = Array.isArray(reporte?.servicios) ? reporte?.servicios : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reportes de Servicios</h2>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
            <SelectItem value="365">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reporte?.total_servicios || 0}</p>
            <p className="text-sm text-muted-foreground">{reporte?.periodo}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${formatCurrency(reporte?.ingresos_totales || 0)}</p>
            <p className="text-sm text-muted-foreground">{reporte?.periodo}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle por Servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio Unit.</TableHead>
                <TableHead>Ingresos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map((servicio, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{servicio.nombre}</TableCell>
                  <TableCell>{servicio.cantidad}</TableCell>
                  <TableCell>${formatCurrency(servicio.precio)}</TableCell>
                  <TableCell className="font-semibold">${formatCurrency(servicio.ingresos)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
