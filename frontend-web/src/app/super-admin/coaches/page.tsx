"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCoaches,
  reviewCoach,
  deleteUser,
  certUrl,
  type Coach,
  ApiError,
} from "@/lib/api";
import { SuperShell } from "@/components/super-shell";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function statusClass(status: string) {
  return { pending: "badge-warning", approved: "badge-success", rejected: "badge-error" }[status] || "";
}

export default function SuperAdminCoachesPage() {
  return (
    <RequireRole role="super_admin">
      <SuperShell title="Coaches">
        <CoachesPage />
      </SuperShell>
    </RequireRole>
  );
}

function CoachesPage() {
  const [status, setStatus] = useState("all");
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ coach: Coach; reason: string } | null>(null);

  const load = useCallback((s: string) => {
    setLoading(true);
    getCoaches(s)
      .then(setCoaches)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load coaches."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(status);
  }, [status, load]);

  async function approve(coach: Coach) {
    setActionLoading(coach.id);
    try {
      await reviewCoach(coach.id, "approve");
      setSuccessMsg(`${coach.name} approved!`);
      load(status);
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
      load(status);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  async function removeCoach(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      setSuccessMsg(`${name} deleted.`);
      load(status);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-full border border-border bg-surface/60 p-1 w-fit">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              status === s ? "bg-violet/20 text-violet" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {successMsg && <p className="rounded-md bg-violet/10 px-3 py-2 text-sm text-violet">{successMsg}</p>}

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
                      className="text-violet hover:underline"
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
                        <Button size="sm" disabled={actionLoading === c.id} onClick={() => approve(c)}>
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
                    <Button size="sm" variant="destructive" onClick={() => removeCoach(c.id, c.name)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

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
