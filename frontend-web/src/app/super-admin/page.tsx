"use client";

import { useEffect, useState } from "react";
import { getStats, type DashboardStats, ApiError } from "@/lib/api";
import { SuperShell } from "@/components/super-shell";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";

export default function SuperAdminOverviewPage() {
  return (
    <RequireRole role="super_admin">
      <SuperShell title="Overview">
        <Overview />
      </SuperShell>
    </RequireRole>
  );
}

function Overview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load stats."));
  }, []);

  return (
    <div className="space-y-6">
      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <StatCard label="Athletes" value={stats.total_athletes} />
          <StatCard label="Coaches" value={stats.total_coaches} />
          <StatCard label="Pending" value={stats.pending_coaches} />
          <StatCard label="Approved" value={stats.approved_coaches} />
          <StatCard label="Rejected" value={stats.rejected_coaches} />
          <StatCard label="Admins" value={stats.total_admins ?? 0} />
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
