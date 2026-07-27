"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getStats,
  getCoaches,
  reviewCoach,
  getAthletes,
  createAthlete,
  deleteUser,
  certUrl,
  type Coach,
  type Athlete,
  type DashboardStats,
  ApiError,
} from "@/lib/api";
import { AdminShell } from "@/components/admin-shell";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Tab = "overview" | "pending" | "coaches" | "athletes";

function statusClass(status: string) {
  return { pending: "badge-warning", approved: "badge-success", rejected: "badge-error" }[status] || "";
}

export default function AdminDashboardPage() {
  return (
    <RequireRole role="admin">
      <AdminShell title="Dashboard">
        <AdminDashboard />
      </AdminShell>
    </RequireRole>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [rejectModal, setRejectModal] = useState<{ coach: Coach; reason: string } | null>(null);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState("");
  const [newAthleteEmail, setNewAthleteEmail] = useState("");
  const [addAthleteLoading, setAddAthleteLoading] = useState(false);

  const loadStats = useCallback(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load stats."));
  }, []);

  const loadCoaches = useCallback((status: string) => {
    setLoading(true);
    getCoaches(status)
      .then(setCoaches)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load coaches."))
      .finally(() => setLoading(false));
  }, []);

  const loadAthletes = useCallback(() => {
    setLoading(true);
    getAthletes()
      .then(setAthletes)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load athletes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
    loadCoaches("pending");
  }, [loadStats, loadCoaches]);

  function setActiveTab(t: Tab) {
    setTab(t);
    setError("");
    setSuccessMsg("");
    if (t === "coaches") loadCoaches("all");
    if (t === "athletes") loadAthletes();
    if (t === "pending") loadCoaches("pending");
  }

  async function approve(coach: Coach) {
    setActionLoading(coach.id);
    try {
      await reviewCoach(coach.id, "approve");
      setSuccessMsg(`${coach.name} approved!`);
      loadCoaches(tab === "coaches" ? "all" : "pending");
      loadStats();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmReject() {
    if (!rejectModal || !rejectModal.reason.trim()) return;
    const { coach, reason } = rejectModal;
    setActionLoading(coach.id);
    setRejectModal(null);
    try {
      await reviewCoach(coach.id, "reject", reason);
      setSuccessMsg(`${coach.name} rejected.`);
      loadCoaches(tab === "coaches" ? "all" : "pending");
      loadStats();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  async function submitAddAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (newAthleteName.trim().length < 2 || !/\S+@\S+\.\S+/.test(newAthleteEmail)) return;
    setAddAthleteLoading(true);
    setError("");
    try {
      const res = await createAthlete(newAthleteName, newAthleteEmail);
      setSuccessMsg(res.message);
      setShowAddAthlete(false);
      setNewAthleteName("");
      setNewAthleteEmail("");
      loadAthletes();
      loadStats();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setAddAthleteLoading(false);
    }
  }

  async function removeUser(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      setSuccessMsg(`${name} deleted.`);
      if (tab === "athletes") loadAthletes();
      else loadCoaches(tab === "coaches" ? "all" : "pending");
      loadStats();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border pb-2">
        {(["overview", "pending", "coaches", "athletes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-teal/15 text-teal" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {successMsg && <p className="rounded-md bg-teal/10 px-3 py-2 text-sm text-teal">{successMsg}</p>}

      {tab === "overview" && stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Athletes" value={stats.total_athletes} />
          <StatCard label="Coaches" value={stats.total_coaches} />
          <StatCard label="Pending" value={stats.pending_coaches} />
          <StatCard label="Approved" value={stats.approved_coaches} />
          <StatCard label="Rejected" value={stats.rejected_coaches} />
        </div>
      )}

      {(tab === "pending" || tab === "coaches") && (
        <Card className="border-border bg-surface/60 p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-white/[0.02] text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Experience</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cert</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && coaches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    No coaches found.
                  </td>
                </tr>
              )}
              {coaches.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3">{c.years_of_experience ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(c.status))}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.certification_filename ? (
                      <a
                        href={certUrl(c.certification_filename)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {c.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            disabled={actionLoading === c.id}
                            onClick={() => approve(c)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === c.id}
                            onClick={() => setRejectModal({ coach: c, reason: "" })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => removeUser(c.id, c.name)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "athletes" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setShowAddAthlete((s) => !s)}>
              {showAddAthlete ? "Cancel" : "+ Add athlete"}
            </Button>
          </div>

          {showAddAthlete && (
            <Card className="border-border bg-surface/60 p-5">
              <form onSubmit={submitAddAthlete} className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ath-name">Name</Label>
                  <Input
                    id="ath-name"
                    value={newAthleteName}
                    onChange={(e) => setNewAthleteName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ath-email">Email</Label>
                  <Input
                    id="ath-email"
                    type="email"
                    value={newAthleteEmail}
                    onChange={(e) => setNewAthleteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-end sm:col-span-1">
                  <Button type="submit" disabled={addAthleteLoading} className="w-full">
                    {addAthleteLoading ? "Creating…" : "Create"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-3">
                  The athlete will get an email with a verification code and a temporary password.
                  Their account stays inactive until they verify.
                </p>
              </form>
            </Card>
          )}

        <Card className="border-border bg-surface/60 p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-white/[0.02] text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Verified</th>
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
              {!loading && athletes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No athletes found.
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
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="destructive" onClick={() => removeUser(a.id, a.name)}>
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

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-sm border-border bg-surface p-6">
            <h2 className="mb-3 text-sm font-bold">Reject {rejectModal.coach.name}?</h2>
            <textarea
              autoFocus
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Reason for rejection…"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={!rejectModal.reason.trim()} onClick={confirmReject}>
                Reject
              </Button>
            </div>
          </Card>
        </div>
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
