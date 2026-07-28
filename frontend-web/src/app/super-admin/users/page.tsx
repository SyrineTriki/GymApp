"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllUsers,
  getAdmins,
  createAdmin,
  deleteAdmin,
  getGyms,
  type Athlete,
  type Admin,
  type Gym,
  ApiError,
} from "@/lib/api";
import { SuperShell } from "@/components/super-shell";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type View = "athletes" | "admins";

export default function SuperAdminUsersPage() {
  return (
    <RequireRole role="super_admin">
      <SuperShell title="Users">
        <UsersPage />
      </SuperShell>
    </RequireRole>
  );
}

function UsersPage() {
  const [view, setView] = useState<View>("athletes");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gymId, setGymId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const loadAthletes = useCallback(() => {
    setLoading(true);
    getAllUsers()
      .then(setAthletes)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const loadAdmins = useCallback(() => {
    setLoading(true);
    getAdmins()
      .then(setAdmins)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load admins."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAthletes();
    getGyms().then(setGyms).catch(() => {});
  }, [loadAthletes]);

  function switchView(v: View) {
    setView(v);
    setError("");
    setSuccessMsg("");
    if (v === "admins") loadAdmins();
    else loadAthletes();
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || !/\S+@\S+\.\S+/.test(email) || password.length < 8 || !gymId) return;
    setCreateLoading(true);
    setError("");
    try {
      await createAdmin(name, email, password, gymId);
      setSuccessMsg(`Admin account created for ${name}.`);
      setShowCreate(false);
      setName("");
      setEmail("");
      setPassword("");
      setGymId("");
      loadAdmins();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function removeAdmin(id: string, adminName: string) {
    if (!confirm(`Delete admin ${adminName}? This cannot be undone.`)) return;
    try {
      await deleteAdmin(id);
      setSuccessMsg(`Admin ${adminName} deleted.`);
      loadAdmins();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-full border border-border bg-surface/60 p-1">
          {(["athletes", "admins"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                view === v ? "bg-violet/20 text-violet" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "athletes" ? "Athletes" : "Admin accounts"}
            </button>
          ))}
        </div>
        {view === "admins" && (
          <Button onClick={() => setShowCreate((s) => !s)}>{showCreate ? "Cancel" : "New admin"}</Button>
        )}
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {successMsg && <p className="rounded-md bg-violet/10 px-3 py-2 text-sm text-violet">{successMsg}</p>}

      {view === "admins" && showCreate && (
        <Card className="border-border bg-surface/60 p-5">
          {gyms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You need at least one gym before creating an admin. Add one on the Gyms page first.
            </p>
          ) : (
            <form onSubmit={submitCreate} className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="a-name">Name</Label>
                <Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-email">Email</Label>
                <Input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-password">Password</Label>
                <Input
                  id="a-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-gym">Gym</Label>
                <select
                  id="a-gym"
                  value={gymId}
                  onChange={(e) => setGymId(e.target.value)}
                  required
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Select a gym…
                  </option>
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating…" : "Create admin"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {view === "athletes" && (
        <Card className="border-border bg-surface/60 p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-white/[0.02] text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && athletes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
              {athletes.map((a) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.is_verified ? "default" : "secondary"}>
                      {a.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view === "admins" && (
        <Card className="border-border bg-surface/60 p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-white/[0.02] text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Gym</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && admins.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No admins found.
                  </td>
                </tr>
              )}
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3">
                    {a.gym_name ? (
                      a.gym_name
                    ) : (
                      <span className="text-xs text-amber">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="destructive" onClick={() => removeAdmin(a.id, a.name)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
