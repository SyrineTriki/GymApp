"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getStats,
  getAdmins,
  createAdmin,
  deleteAdmin,
  type Admin,
  type DashboardStats,
  ApiError,
} from "@/lib/api";
import { SuperShell } from "@/components/super-shell";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Tab = "overview" | "admins";

export default function SuperAdminPage() {
  return (
    <RequireRole role="super_admin">
      <SuperShell title="Command Center">
        <SuperAdminDashboard />
      </SuperShell>
    </RequireRole>
  );
}

function SuperAdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const loadStats = useCallback(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load stats."));
  }, []);

  const loadAdmins = useCallback(() => {
    setLoading(true);
    getAdmins()
      .then(setAdmins)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load admins."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
    loadAdmins();
  }, [loadStats, loadAdmins]);

  function setActiveTab(t: Tab) {
    setTab(t);
    setError("");
    setSuccessMsg("");
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || !/\S+@\S+\.\S+/.test(email) || password.length < 8) return;
    setCreateLoading(true);
    setError("");
    try {
      await createAdmin(name, email, password);
      setSuccessMsg(`Admin account created for ${name}.`);
      setShowCreate(false);
      setName("");
      setEmail("");
      setPassword("");
      loadAdmins();
      loadStats();
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
      loadStats();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border pb-2">
        {(["overview", "admins"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-violet/15 text-violet" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {successMsg && <p className="rounded-md bg-violet/10 px-3 py-2 text-sm text-violet">{successMsg}</p>}

      {tab === "overview" && stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <StatCard label="Athletes" value={stats.total_athletes} />
          <StatCard label="Coaches" value={stats.total_coaches} />
          <StatCard label="Pending" value={stats.pending_coaches} />
          <StatCard label="Approved" value={stats.approved_coaches} />
          <StatCard label="Rejected" value={stats.rejected_coaches} />
          <StatCard label="Admins" value={stats.total_admins ?? 0} />
        </div>
      )}

      {tab === "admins" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setShowCreate((s) => !s)}>
              {showCreate ? "Cancel" : "New admin"}
            </Button>
          </div>

          {showCreate && (
            <Card className="border-border bg-surface/60 p-5">
              <form onSubmit={submitCreate} className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="a-name">Name</Label>
                  <Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="a-email">Email</Label>
                  <Input
                    id="a-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                <div className="sm:col-span-3">
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating…" : "Create admin"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card className="border-border bg-surface/60 p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-white/[0.02] text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
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
                {!loading && admins.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No admins found.
                    </td>
                  </tr>
                )}
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
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
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="border-border bg-surface/60 p-4">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
