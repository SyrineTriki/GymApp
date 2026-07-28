"use client";

import { useEffect, useState } from "react";
import { getAnalytics, type Analytics, ApiError } from "@/lib/api";
import { SuperShell } from "@/components/super-shell";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";

export default function SuperAdminAnalyticsPage() {
  return (
    <RequireRole role="super_admin">
      <SuperShell title="Analytics">
        <AnalyticsPage />
      </SuperShell>
    </RequireRole>
  );
}

const CATEGORY_COLOR: Record<string, string> = {
  protein: "bg-rose",
  carbs: "bg-amber",
  fats: "bg-violet",
  produce: "bg-teal",
  dairy: "bg-blue-400",
  supplement: "bg-teal",
};

function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load analytics."));
  }, []);

  if (error) {
    return <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const maxSignup = Math.max(1, ...data.signups_by_day.map((p) => p.athletes + p.coaches));
  const statusTotal =
    data.coach_status_breakdown.pending +
    data.coach_status_breakdown.approved +
    data.coach_status_breakdown.rejected || 1;
  const maxFoodCount = Math.max(1, ...data.food_category_breakdown.map((f) => f.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gyms" value={data.total_gyms} />
        <StatCard label="Admins" value={data.total_admins} />
        <StatCard label="Pending coaches" value={data.coach_status_breakdown.pending} />
        <StatCard label="Approved coaches" value={data.coach_status_breakdown.approved} />
      </div>

      {/* Signups over time */}
      <Card className="border-border bg-surface/60 p-5">
        <h2 className="mb-4 text-sm font-semibold">Signups (last 30 days)</h2>
        {data.signups_by_day.length === 0 ? (
          <p className="text-sm text-muted-foreground">No signups recorded yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-1 overflow-x-auto">
            {data.signups_by_day.map((p) => {
              const total = p.athletes + p.coaches;
              const heightPct = (total / maxSignup) * 100;
              const athletePct = total ? (p.athletes / total) * 100 : 0;
              return (
                <div key={p.date} className="flex w-6 shrink-0 flex-col items-center gap-1" title={p.date}>
                  <div
                    className="flex w-4 flex-col-reverse overflow-hidden rounded-sm bg-white/[0.04]"
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                  >
                    <div className="bg-teal" style={{ height: `${athletePct}%` }} />
                    <div className="bg-violet" style={{ height: `${100 - athletePct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-teal" /> Athletes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-violet" /> Coaches
          </span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Coach approval funnel */}
        <Card className="border-border bg-surface/60 p-5">
          <h2 className="mb-4 text-sm font-semibold">Coach approval funnel</h2>
          <div className="space-y-3">
            {(
              [
                ["Pending", data.coach_status_breakdown.pending, "bg-amber"],
                ["Approved", data.coach_status_breakdown.approved, "bg-teal"],
                ["Rejected", data.coach_status_breakdown.rejected, "bg-rose"],
              ] as const
            ).map(([label, count, color]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{label}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                  <div className={`h-full ${color}`} style={{ width: `${(count / statusTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Food catalog breakdown */}
        <Card className="border-border bg-surface/60 p-5">
          <h2 className="mb-4 text-sm font-semibold">Food catalog by category</h2>
          {data.food_category_breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No food items yet.</p>
          ) : (
            <div className="space-y-3">
              {data.food_category_breakdown.map((f) => (
                <div key={f.category}>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{f.category}</span>
                    <span>
                      {f.count} items · avg {f.avg_price.toFixed(2)} TND
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className={`h-full ${CATEGORY_COLOR[f.category] || "bg-violet"}`}
                      style={{ width: `${(f.count / maxFoodCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
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
