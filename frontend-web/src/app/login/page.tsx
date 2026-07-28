"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const { login, logout, isLoggedIn, isAdmin, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      if (isSuperAdmin) router.replace("/super-admin");
      else if (isAdmin) router.replace("/admin");
    }
  }, [authLoading, isLoggedIn, isAdmin, isSuperAdmin, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const role = localStorage.getItem("role");
      if (role === "super_admin") {
        router.replace("/super-admin");
      } else if (role === "admin") {
        router.replace("/admin");
      } else {
        // Athlete/coach accounts use the mobile app, not this portal.
        logout();
        setError("This portal is for admin and super admin accounts only.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ambient-orb animate-float top-[-10%] left-[10%] h-96 w-96 bg-teal/20" />
        <div
          className="ambient-orb animate-float top-[50%] right-[-8%] h-[28rem] w-[28rem] bg-violet/20"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      <Card className="relative w-full max-w-sm border-border bg-surface/70 p-8 backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-violet shadow-[0_8px_24px_-8px_var(--teal-glow)] animate-pulse-glow">
              <Zap className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">GymApp</span>
            <span className="rounded-full border border-teal/30 bg-teal/10 px-2.5 py-0.5 text-xs font-semibold text-teal">
              Admin Portal
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">Admin and super admin access only.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-violet hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
