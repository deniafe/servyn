"use client";

import * as React from "react";
import { LocateFixed } from "lucide-react";

const AREA_COORDS: Record<string, [number, number]> = {
  Hulme: [53.4631, -2.2499],
  Salford: [53.4875, -2.2901],
  "Cheetham Hill": [53.5051, -2.2442],
  Levenshulme: [53.4422, -2.1904],
  "Moss Side": [53.4573, -2.2422],
  Ardwick: [53.4697, -2.2194],
  Gorton: [53.4622, -2.1695],
  Chorlton: [53.4408, -2.2738],
  Trafford: [53.4648, -2.3095],
  Oldham: [53.5409, -2.1114],
  Manchester: [53.4808, -2.2426],
};

export interface LeafletServiceMapProps {
  providerName: string;
  area: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export function LeafletServiceMap({
  providerName,
  area,
  address,
  lat,
  lng,
}: LeafletServiceMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<{
    flyTo: (latlng: [number, number], zoom?: number) => void;
    remove: () => void;
  } | null>(null);

  const fallback = AREA_COORDS[area] ?? AREA_COORDS.Manchester ?? [53.4808, -2.2426];
  const centerLat = typeof lat === "number" ? lat : fallback[0];
  const centerLng = typeof lng === "number" ? lng : fallback[1];
  const defaultZoom = address ? 15 : 13;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let destroyed = false;

    void Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      if (destroyed || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom: defaultZoom,
        dragging: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        zoomControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      L.circle([centerLat, centerLng], {
        radius: address ? 320 : 1100,
        color: "#0d3b29",
        weight: 1.5,
        opacity: 0.45,
        fillColor: "#1a5c42",
        fillOpacity: 0.12,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "servyn-map-pin",
        html: `<div style="width:30px;height:30px;border-radius:9999px;background:#0d3b29;border:3px solid #f2b84b;box-shadow:0 6px 16px rgba(7,30,22,0.38);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:9999px;background:#f7f4ec;"></div></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([centerLat, centerLng], { icon: pinIcon }).addTo(map);
      const label = address
        ? `<div class="servyn-map-popup"><strong class="servyn-map-popup-title">${providerName}</strong><div class="servyn-map-popup-sub">${address}</div></div>`
        : `<div class="servyn-map-popup"><strong class="servyn-map-popup-title">${providerName}</strong><div class="servyn-map-popup-sub">${area}, Manchester</div></div>`;
      marker.bindPopup(label, { closeButton: false }).openPopup();

      mapRef.current = map;
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [providerName, area, address, centerLat, centerLng, defaultZoom]);

  return (
    <div className="servyn-leaflet-map relative z-0 overflow-hidden rounded-[16px] border border-line bg-cream-2">
      <div
        ref={containerRef}
        aria-label={`Interactive map showing ${providerName} in ${address ?? area}`}
        className="h-72 w-full sm:h-80"
      />
      <button
        type="button"
        onClick={() => mapRef.current?.flyTo([centerLat, centerLng], defaultZoom)}
        className="absolute top-3 right-3 z-[400] inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-soft transition-colors hover:border-leaf-700 hover:text-leaf-800"
      >
        <LocateFixed className="size-3.5 text-leaf-700" aria-hidden="true" />
        <span>Re-center</span>
      </button>
    </div>
  );
}
