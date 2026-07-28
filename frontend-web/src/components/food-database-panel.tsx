"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  getFood,
  createFood,
  updateFood,
  deleteFood,
  type Food,
  type FoodCategory,
  ApiError,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";


const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "protein", label: "Protein" },
  { value: "carbs", label: "Carbs" },
  { value: "fats", label: "Fats" },
  { value: "produce", label: "Produce" },
  { value: "dairy", label: "Dairy" },
  { value: "supplement", label: "Supplement" },
];

const CATEGORY_BADGE: Record<string, string> = {
  protein: "bg-rose/15 text-rose",
  carbs: "bg-amber/15 text-amber",
  fats: "bg-violet/15 text-violet",
  produce: "bg-teal/15 text-teal",
  dairy: "bg-blue-400/15 text-blue-300",
  supplement: "bg-teal/15 text-teal",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function foodCode(index: number): string {
  return `F-${String(index + 1).padStart(2, "0")}`;
}

interface FormState {
  id?: string;
  name: string;
  category: FoodCategory;
  price: string;
  unit: string;
}

const emptyForm: FormState = { name: "", category: "protein", price: "", unit: "" };

export function FoodDatabasePanel() {
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback((cat: string) => {
    setLoading(true);
    getFood(cat)
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load food database."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(category);
  }, [category, load]);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const price = Number(form.price);
    if (form.name.trim().length < 1 || !form.unit.trim() || !(price > 0)) return;
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        await updateFood(form.id, { name: form.name, category: form.category, price, unit: form.unit });
        setSuccessMsg(`${form.name} updated.`);
      } else {
        await createFood({ name: form.name, category: form.category, price, unit: form.unit });
        setSuccessMsg(`${form.name} added.`);
      }
      setForm(null);
      load(category);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function removeFood(f: Food) {
    if (!confirm(`Delete ${f.name}? This cannot be undone.`)) return;
    try {
      await deleteFood(f.id);
      setSuccessMsg(`${f.name} deleted.`);
      load(category);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 rounded-full border border-border bg-surface/60 p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                category === c.value ? "bg-teal/20 text-teal" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setForm({ ...emptyForm, category: (category === "all" ? "protein" : category) as FoodCategory })}>
          + Add food
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {successMsg && <p className="rounded-md bg-teal/10 px-3 py-2 text-sm text-teal">{successMsg}</p>}

      <Card className="border-border bg-surface/60 p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-white/[0.02] text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Food</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Trend</th>
              <th className="px-4 py-3 font-medium">Updated</th>
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
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No food items found.
                </td>
              </tr>
            )}
            {items.map((f, i) => (
              <tr key={f.id} className="border-b border-border/60 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold">{f.name}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{foodCode(i)}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
                      CATEGORY_BADGE[f.category],
                    )}
                  >
                    {f.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono font-semibold">
                    {f.price.toFixed(2)} {f.currency}
                  </div>
                  <div className="text-xs text-muted-foreground">/ {f.unit}</div>
                </td>
                <td className="px-4 py-3">
                  {f.trend === "up" && <TrendingUp className="size-4 text-rose" />}
                  {f.trend === "down" && <TrendingDown className="size-4 text-teal" />}
                  {f.trend === "flat" && <Minus className="size-4 text-muted-foreground" />}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{timeAgo(f.updated_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          id: f.id,
                          name: f.name,
                          category: f.category,
                          price: String(f.price),
                          unit: f.unit,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeFood(f)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-sm border-border bg-surface p-6">
            <h2 className="mb-4 text-sm font-bold">{form.id ? "Edit food item" : "Add food item"}</h2>
            <form onSubmit={submitForm} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="f-name">Name</Label>
                <Input
                  id="f-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-category">Category</Label>
                <select
                  id="f-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as FoodCategory })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="f-price">Price (TND)</Label>
                  <Input
                    id="f-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-unit">Unit</Label>
                  <Input
                    id="f-unit"
                    placeholder="kg, 500 g, L…"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : form.id ? "Save changes" : "Add food"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
