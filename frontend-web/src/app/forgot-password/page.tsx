"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { adminForgotPassword, adminResetPassword, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Step = "email" | "reset" | "done";

function passwordError(v: string): string {
  if (!v) return "";
  if (v.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(v)) return "Add at least one uppercase letter.";
  if (!/\d/.test(v)) return "Add at least one number.";
  return "";
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await adminForgotPassword(email);
      setInfo(res.message);
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const pwError = passwordError(newPassword);

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6 || pwError || !newPassword) return;
    setLoading(true);
    setError("");
    try {
      await adminResetPassword(email, code, newPassword);
      setStep("done");
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
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-teal to-violet shadow-[0_8px_24px_-8px_var(--teal-glow)]">
            <KeyRound className="size-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Reset admin password</h1>
            <p className="text-sm text-muted-foreground">Admin and super admin accounts only.</p>
          </div>
        </div>

        {step === "email" && (
          <form onSubmit={submitEmail} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send reset code"}
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={submitReset} className="space-y-4">
            {info && <p className="rounded-md bg-teal/10 px-3 py-2 text-sm text-teal">{info}</p>}

            <div className="space-y-1.5">
              <Label>Verification code</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {newPassword && pwError && <p className="text-xs text-destructive">{pwError}</p>}
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={loading || code.length !== 6 || !!pwError} className="w-full">
              {loading ? "Resetting…" : "Reset password"}
            </Button>

            <button
              type="button"
              onClick={() => submitEmail({ preventDefault() {} } as React.FormEvent)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Resend code
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <CheckCircle2 className="size-12 text-teal" />
            <p className="text-sm text-muted-foreground">
              Password updated. You can now sign in with your new password.
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Go to login
            </Button>
          </div>
        )}

        {step !== "done" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="text-violet hover:underline">
              Back to sign in
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
