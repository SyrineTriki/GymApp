"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Gym } from "@/lib/api";

// Leaflet's default marker icons reference image paths that don't resolve
// correctly through bundlers — point them at the CDN instead.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ gyms }: { gyms: Gym[] }) {
  const map = useMap();
  useEffect(() => {
    const points = gyms
      .filter((g) => g.latitude != null && g.longitude != null)
      .map((g) => [g.latitude as number, g.longitude as number] as [number, number]);
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [gyms, map]);
  return null;
}

export default function GymMap({ gyms }: { gyms: Gym[] }) {
  const located = gyms.filter((g) => g.latitude != null && g.longitude != null);
  const center: [number, number] = located.length
    ? [located[0].latitude as number, located[0].longitude as number]
    : [36.8065, 10.1815]; // Tunis, as a sane default

  return (
    <div className="h-[480px] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer center={center} zoom={located.length ? 12 : 6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds gyms={gyms} />
        {located.map((g) => (
          <Marker key={g.id} position={[g.latitude as number, g.longitude as number]} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{g.name}</div>
                <div className="text-xs text-gray-600">{g.location}</div>
                <div className="mt-1 text-xs">
                  {g.price_per_month.toFixed(2)} TND/month · {g.admin_count} admin{g.admin_count === 1 ? "" : "s"}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
