"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Trophy, Eye, EyeOff, Upload, X, CheckCircle2 } from "lucide-react";
import { registerAthlete, registerCoach, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Role = "athlete" | "coach";
type Step = "role" | "details" | "success";

function maxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 14);
  return d.toISOString().split("T")[0];
}

function passwordError(v: string): string {
  if (!v) return "";
  if (v.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(v)) return "Add at least one uppercase letter.";
  if (!/\d/.test(v)) return "Add at least one number.";
  return "";
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [bio, setBio] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certError, setCertError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setCertError("");
    setCertFile(null);
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      setCertError("Only PDF, JPEG, or PNG files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCertError("File must be under 5 MB.");
      return;
    }
    setCertFile(file);
  }

  const pwError = passwordError(password);
  const ageOk = !dob || new Date(dob) <= new Date(maxDob());
  const formValid =
    name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    !pwError &&
    password.length > 0 &&
    dob.length > 0 &&
    ageOk;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!formValid || certError) return;
    setLoading(true);
    setError("");
    try {
      if (role === "athlete") {
        await registerAthlete({ name, email, password, date_of_birth: dob });
      } else {
        await registerCoach({
          name,
          email,
          password,
          date_of_birth: dob,
          years_of_experience: yearsExp ? Number(yearsExp) : undefined,
          bio: bio || undefined,
          certification: certFile,
        });
      }
      setStep("success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 py-12">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ambient-orb animate-float top-[-10%] left-[10%] h-96 w-96 bg-teal/20" />
        <div
          className="ambient-orb animate-float top-[50%] right-[-8%] h-[28rem] w-[28rem] bg-violet/20"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      <Card className="relative w-full max-w-md border-border bg-surface/70 p-8 backdrop-blur-xl">
        {step === "role" && (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-lg font-bold tracking-tight">Create your account</h1>
              <p className="text-sm text-muted-foreground">Choose how you&apos;ll use GymApp</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                icon={Dumbbell}
                label="Athlete"
                active={role === "athlete"}
                onClick={() => setRole("athlete")}
              />
              <RoleCard
                icon={Trophy}
                label="Coach"
                active={role === "coach"}
                onClick={() => setRole("coach")}
              />
            </div>
            <Button className="mt-6 w-full" disabled={!role} onClick={() => setStep("details")}>
              Continue
            </Button>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-violet hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}

        {step === "details" && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setStep("role")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <h1 className="mt-2 text-lg font-bold tracking-tight">
                {role === "athlete" ? "Athlete details" : "Coach details"}
              </h1>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                {touched && name.trim().length < 2 && (
                  <p className="text-xs text-destructive">Name must be at least 2 characters.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {touched && pwError && <p className="text-xs text-destructive">{pwError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  required
                  max={maxDob()}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
                {touched && !ageOk && (
                  <p className="text-xs text-destructive">You must be at least 14 years old.</p>
                )}
              </div>

              {role === "coach" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="years">Years of experience</Label>
                    <Input
                      id="years"
                      type="number"
                      min={0}
                      max={60}
                      value={yearsExp}
                      onChange={(e) => setYearsExp(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      maxLength={500}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Certification (PDF, JPEG, or PNG · max 5MB)</Label>
                    {certFile ? (
                      <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <span className="truncate">{certFile.name}</span>
                        <button type="button" onClick={() => setCertFile(null)}>
                          <X className="size-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-4 text-sm text-muted-foreground hover:text-foreground">
                        <Upload className="size-4" />
                        Upload file
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={onFileChange}
                        />
                      </label>
                    )}
                    {certError && <p className="text-xs text-destructive">{certError}</p>}
                  </div>
                </>
              )}

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Submitting…" : "Create account"}
              </Button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="size-12 text-teal" />
            <h1 className="text-lg font-bold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a verification code to <span className="text-foreground">{email}</span>.
            </p>
            <Button
              className="w-full"
              onClick={() => router.push(`/verify-email?email=${encodeURIComponent(email)}`)}
            >
              Enter verification code
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Dumbbell;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border p-5 transition-all",
        active
          ? "border-violet/60 bg-violet/10 text-violet"
          : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-6" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
