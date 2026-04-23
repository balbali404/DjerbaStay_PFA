"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type AccommodationLocationMapProps = {
  name: string;
  latitude: number;
  longitude: number;
  area?: string | null;
};

const DEFAULT_CENTER: [number, number] = [10.8451, 33.8076];
const STYLE_URL = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export default function AccommodationLocationMap({
  name,
  latitude,
  longitude,
  area,
}: AccommodationLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const hasValidCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const center = useMemo<[number, number]>(
    () => (hasValidCoordinates ? [longitude, latitude] : DEFAULT_CENTER),
    [hasValidCoordinates, longitude, latitude]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLE_URL,
      center,
      zoom: hasValidCoordinates ? 13 : 10,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const onLoad = () => setMapLoaded(true);
    map.on("load", onLoad);
    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.off("load", onLoad);
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [center, hasValidCoordinates]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center,
      zoom: hasValidCoordinates ? 13 : 10,
      essential: true,
      duration: 1200,
    });
  }, [center, hasValidCoordinates]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !hasValidCoordinates) {
      return;
    }

    markerRef.current?.remove();

    const markerEl = document.createElement("div");
    markerEl.className = "ml-marker ml-marker-home";
    markerEl.innerHTML = '<span class="ml-marker-home-glyph">H</span>';

    markerRef.current = new maplibregl.Marker({ element: markerEl })
      .setLngLat([longitude, latitude])
      .setPopup(
        new maplibregl.Popup({ offset: 18 }).setHTML(
          `<strong>${name}</strong><br>${area || "Djerba, Tunisia"}`
        )
      )
      .addTo(mapRef.current);
  }, [area, hasValidCoordinates, latitude, longitude, mapLoaded, name]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
      <div ref={mapContainerRef} className="h-full w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
          Loading map...
        </div>
      )}
    </div>
  );
}
