"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Turno } from "../turnos/turnos-grid"
import { CreditCardIcon, Loader2Icon, WalletIcon, XIcon } from "lucide-react"

interface CerrarTurnoModalProps {
  turno: Turno
  onSuccess: () => void
}

export function CerrarTurnoModal({ turno, onSuccess }: CerrarTurnoModalProps) {
  const [monto, setMonto] = useState(turno.servicios.precio.toString())
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turno_id: turno.id,
          monto: Number.parseFloat(monto),
          metodo_pago: metodoPago,
        }),
      })

      if (res.ok) {
        onSuccess()
        setOpen(false)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 gap-2">
          <WalletIcon className="h-3.5 w-3.5" />
          Cerrar & Cobrar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar Turno y Registrar Pago</DialogTitle>
          <DialogDescription>
            {`${turno.clientes.nombre} ${turno.clientes.apellido} - ${turno.servicios.nombre}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Monto Cobrado</label>
            <Input
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Metodo de Pago</label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="flex-1 gap-2">
              <XIcon className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-4 w-4" />
                  Cobrar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
