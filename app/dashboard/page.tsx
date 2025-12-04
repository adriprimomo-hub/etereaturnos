"use client"

import { TurnosGrid } from "@/components/turnos/turnos-grid"
import { ClientesList } from "@/components/clientes/clientes-list"
import { ServiciosList } from "@/components/servicios/servicios-list"
import { ReportesServicios } from "@/components/reportes/reportes-servicios"
import { ConfigForm } from "@/components/config/config-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-4 sm:p-6">
          <div className="max-w-7xl mx-auto text-sm text-muted-foreground">Cargando tablero...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const allowedTabs = useMemo(() => new Set(["turnos", "clientes", "servicios", "reportes", "config"]), [])
  const searchTab = searchParams.get("tab") || ""
  const pathTab = pathname?.endsWith("/config") ? "config" : ""
  const initialTab = allowedTabs.has(pathTab) ? pathTab : allowedTabs.has(searchTab) ? searchTab : "turnos"
  const [tab, setTab] = useState<string>(initialTab)

  useEffect(() => {
    const current = searchParams.get("tab") || ""
    const fromPath = pathname?.endsWith("/config") ? "config" : ""
    const nextValue = allowedTabs.has(fromPath) ? fromPath : allowedTabs.has(current) ? current : "turnos"
    if (nextValue !== tab) {
      setTab(nextValue)
    }
  }, [allowedTabs, searchParams, pathname, tab])

  const handleTabChange = (value: string) => {
    setTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8"></div>

        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex-wrap w-full justify-start gap-2">
            <TabsTrigger value="turnos" className="flex-1 sm:flex-none">
              Turnos
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex-1 sm:flex-none">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="servicios" className="flex-1 sm:flex-none">
              Servicios
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex-1 sm:flex-none">
              Reportes
            </TabsTrigger>
            <TabsTrigger value="config" className="flex-1 sm:flex-none">
              Configuracion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="turnos" className="mt-6">
            <TurnosGrid />
          </TabsContent>

          <TabsContent value="clientes" className="mt-6">
            <ClientesList />
          </TabsContent>

          <TabsContent value="servicios" className="mt-6">
            <ServiciosList />
          </TabsContent>

          <TabsContent value="reportes" className="mt-6">
            <ReportesServicios />
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <ConfigForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
