"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (signUpError) {
          setError(signUpError.message)
        } else if (data.user) {
          const response = await fetch("/api/auth/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: data.user.id,
              email: data.user.email,
            }),
          })

          if (!response.ok) {
            console.error("Error creating user record")
          }

          setError("Revisa tu email para confirmar la cuenta")
          setEmail("")
          setPassword("")
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
        } else if (data.user) {
          const response = await fetch("/api/auth/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: data.user.id,
              email: data.user.email,
            }),
          })

          if (!response.ok) {
            console.error("Error ensuring user record exists")
          }

          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("Error al conectar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Eterea Turnos</CardTitle>
          
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? isSignUp
                  ? "Creando cuenta..."
                  : "Conectando..."
                : isSignUp
                  ? "Crear cuenta"
                  : "Iniciar sesión"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
