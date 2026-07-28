"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Building2, Users as UsersIcon, MapPin, LayoutGrid, Map as MapIcon } from "lucide-react";
import { getGyms, createGym, updateGym, deleteGym, type Gym, ApiError } from "@/lib/api";
import { SuperShell } from "@/components/super-shell";
import { RequireRole } from "@/components/require-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const GymMap = dynamic(() => import("@/components/gym-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-xl border border-border text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export default function SuperAdminGymsPage() {
  return (
    <RequireRole role="super_admin">
      <SuperShell title="Gyms">
        <GymsPage />
      </SuperShell>
    </RequireRole>
  );
}

interface FormState {
  id?: string;
  name: string;
  owner_name: string;
  location: string;
  price_per_month: string;
  latitude: string;
  longitude: string;
}

const emptyForm: FormState = {
  name: "",
  owner_name: "",
  location: "",
  price_per_month: "",
  latitude: "",
  longitude: "",
};

function GymsPage() {
  const [view, setView] = useState<"grid" | "map">("grid");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  function load() {
    setLoading(true);
    getGyms()
      .then(setGyms)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load gyms."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function locateAddress() {
    if (!form || !form.location.trim()) return;
    setLocating(true);
    setError("");
    const text = form.location.trim();

    // Handle coordinates/Google Maps links pasted directly into the field —
    // these aren't addresses, so the text geocoder below won't understand them.
    const patterns = [
      /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,          // .../@36.8065,10.1815,17z/...
      /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,       // ...!3d36.8065!4d10.1815... (exact pin)
      /^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/,    // "36.8065, 10.1815" copied via Google's "copy coordinates"
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        setForm({ ...form, latitude: m[1], longitude: m[2] });
        setLocating(false);
        return;
      }
    }
    if (/goo\.gl|maps\.app\.goo\.gl/.test(text)) {
      setError("Short Google Maps links can't be read directly — open the link, then copy the full URL or the coordinates from the address bar instead.");
      setLocating(false);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(text)}`,
      );
      const results = await res.json();
      if (results?.[0]) {
        setForm({ ...form, latitude: results[0].lat, longitude: results[0].lon });
      } else {
        setError("Couldn't find that address — try a plain address/place name, paste Google Maps coordinates, or set the pin manually below.");
      }
    } catch {
      setError("Couldn't reach the location service. Try again in a moment.");
    } finally {
      setLocating(false);
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const price = Number(form.price_per_month);
    if (form.name.trim().length < 1 || !form.owner_name.trim() || !form.location.trim() || !(price > 0)) return;
    setSaving(true);
    setError("");
    try {
      const input = {
        name: form.name,
        owner_name: form.owner_name,
        location: form.location,
        price_per_month: price,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
      };
      if (form.id) {
        await updateGym(form.id, input);
        setSuccessMsg(`${form.name} updated.`);
      } else {
        await createGym(input);
        setSuccessMsg(`${form.name} added.`);
      }
      setForm(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function removeGym(g: Gym) {
    if (!confirm(`Delete ${g.name}? This cannot be undone.`)) return;
    try {
      await deleteGym(g.id);
      setSuccessMsg(`${g.name} deleted.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-full border border-border bg-surface/60 p-1">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              view === "grid" ? "bg-violet/20 text-violet" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" /> Grid
          </button>
          <button
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              view === "map" ? "bg-violet/20 text-violet" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MapIcon className="size-3.5" /> Map
          </button>
        </div>
        <Button onClick={() => setForm({ ...emptyForm })}>+ Add gym</Button>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {successMsg && <p className="rounded-md bg-violet/10 px-3 py-2 text-sm text-violet">{successMsg}</p>}

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && gyms.length === 0 && (
        <Card className="border-border bg-surface/60 p-8 text-center text-sm text-muted-foreground">
          No gyms yet.
        </Card>
      )}

      {!loading && gyms.length > 0 && view === "map" && <GymMap gyms={gyms} />}

      {!loading && gyms.length > 0 && view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gyms.map((g) => (
            <Card key={g.id} className="border-border bg-surface/60 p-5">
              <div className="mb-3 flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-violet/15 text-violet">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{g.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{g.location}</div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Owner: {g.owner_name}</div>
                <div className="font-mono font-semibold text-foreground">
                  {g.price_per_month.toFixed(2)} TND<span className="font-normal text-muted-foreground">/month</span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <UsersIcon className="size-3.5" />
                  {g.admin_count} admin{g.admin_count === 1 ? "" : "s"}
                </div>
                {g.latitude != null && g.longitude != null && (
                  <div className="flex items-center gap-1.5 text-teal">
                    <MapPin className="size-3.5" /> Located on map
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      id: g.id,
                      name: g.name,
                      owner_name: g.owner_name,
                      location: g.location,
                      price_per_month: String(g.price_per_month),
                      latitude: g.latitude != null ? String(g.latitude) : "",
                      longitude: g.longitude != null ? String(g.longitude) : "",
                    })
                  }
                >
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => removeGym(g)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-sm border-border bg-surface p-6">
            <h2 className="mb-4 text-sm font-bold">{form.id ? "Edit gym" : "Add gym"}</h2>
            <form onSubmit={submitForm} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="g-name">Name</Label>
                <Input
                  id="g-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-owner">Gym owner</Label>
                <Input
                  id="g-owner"
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-location">Location</Label>
                <div className="flex gap-2">
                  <Input
                    id="g-location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Address, Google Maps link, or lat, lng"
                    required
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" disabled={locating} onClick={locateAddress}>
                    {locating ? "…" : "Locate"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste a plain address, a full Google Maps URL, or coordinates copied from Google Maps.
                </p>
                {form.latitude && form.longitude && (
                  <p className="text-xs text-teal">
                    Pinned at {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="g-lat">Latitude</Label>
                  <Input
                    id="g-lat"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="g-lng">Longitude</Label>
                  <Input
                    id="g-lng"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="optional"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-price">Price per month (TND)</Label>
                <Input
                  id="g-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price_per_month}
                  onChange={(e) => setForm({ ...form, price_per_month: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : form.id ? "Save changes" : "Add gym"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
