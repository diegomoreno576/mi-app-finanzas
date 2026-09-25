"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/site-url";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "unconfirmed") {
      setNeedsConfirmation(true);
      setError("Confirma tu email antes de iniciar sesión.");
    }
  }, [searchParams]);

  async function resendConfirmation() {
    setError(null);
    setResending(true);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (resendError) {
      setError(getAuthErrorMessage(resendError.message));
    } else {
      setSuccess(
        "Te hemos reenviado el correo de confirmación. Revisa tu bandeja y spam."
      );
    }
    setResending(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setNeedsConfirmation(false);
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const isUnconfirmed = authError.message
        .toLowerCase()
        .includes("email not confirmed");
      setNeedsConfirmation(isUnconfirmed);
      setError(getAuthErrorMessage(authError.message));
      setLoading(false);
      return;
    }

    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      setNeedsConfirmation(true);
      setError("Confirma tu email antes de iniciar sesión.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Accede a tu panel de finanzas personales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <p>{error}</p>
              {needsConfirmation && (
                <button
                  type="button"
                  disabled={resending || !email}
                  onClick={resendConfirmation}
                  className="font-medium text-red-300 underline underline-offset-2 hover:text-red-200 disabled:opacity-50"
                >
                  {resending ? "Reenviando…" : "Reenviar correo"}
                </button>
              )}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              {success}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-violet-400 hover:text-violet-300"
          >
            Regístrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
