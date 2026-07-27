"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { verifyCode, resendCode, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

function VerifyEmailForm() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    if (code.length !== 6 || !email) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await verifyCode(email, code);
      setStatus("success");
      setMessage(res.message);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) return;
    setResending(true);
    setMessage("");
    try {
      const res = await resendCode(email);
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setResending(false);
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

      <Card className="relative w-full max-w-sm border-border bg-surface/70 p-8 text-center backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-teal to-violet shadow-[0_8px_24px_-8px_var(--teal-glow)]">
            <MailCheck className="size-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Verify your email</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to {email || "your email"}
            </p>
          </div>
        </div>

        {status === "success" ? (
          <>
            <p className="rounded-md bg-teal/10 px-3 py-2 text-sm text-teal">{message}</p>
            <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
              Go to login
            </Button>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {message && (
              <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {message}
              </p>
            )}

            <Button className="mt-6 w-full" disabled={loading || code.length !== 6} onClick={submit}>
              {loading ? "Verifying…" : "Verify"}
            </Button>
            <button
              onClick={resend}
              disabled={resending}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          </>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
