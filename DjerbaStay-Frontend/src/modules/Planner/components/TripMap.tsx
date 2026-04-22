"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import Icon from "@/components/Icon";
import type { TripDay } from "@/lib/aiClient";
import { DEFAULT_LAT, DEFAULT_LON } from "../constants";
import { classNames } from "../utils";

type TripMapProps = {
  accommodationName: string;
  accommodationLat: number;
  accommodationLon: number;
  itinerary: TripDay[];
  dayIndex: number;
  activityIndex: number;
  autoPlay: boolean;
  progressPct: number;
  onSelectDay: (index: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToggleAutoPlay: () => void;
};

const STYLE_URL = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const ROUTE_SOURCE_ID = "trip-route-source";
const ROUTE_LAYER_ID = "trip-route-layer";
const ROUTE_GLOW_LAYER_ID = "trip-route-glow-layer";
const BUILDING_LAYER_ID = "trip-3d-buildings";

function isGeoJsonSource(
  source: unknown
): source is maplibregl.GeoJSONSource {
  return Boolean(
    source &&
      typeof source === "object" &&
      "setData" in source &&
      typeof (source as { setData?: unknown }).setData === "function"
  );
}

export default function TripMap({
  accommodationName,
  accommodationLat,
  accommodationLon,
  itinerary,
  dayIndex,
  activityIndex,
  autoPlay,
  progressPct,
  onSelectDay,
  onPrevDay,
  onNextDay,
  onToggleAutoPlay,
}: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const homeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeAnimationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const activePlaces = useMemo(
    () => itinerary[dayIndex]?.places ?? [],
    [itinerary, dayIndex]
  );
  const visiblePlaces = useMemo(
    () => (activityIndex >= 0 ? activePlaces.slice(0, activityIndex + 1) : []),
    [activePlaces, activityIndex]
  );

  const currentActivityName =
    activityIndex >= 0 && activePlaces[activityIndex]
      ? activePlaces[activityIndex].name
      : "Your Accommodation";

  function removeStopMarkers() {
    stopMarkersRef.current.forEach((marker) => marker.remove());
    stopMarkersRef.current = [];
  }

  function removeRouteLayers(map: maplibregl.Map) {
    if (map.getLayer(ROUTE_LAYER_ID)) {
      map.removeLayer(ROUTE_LAYER_ID);
    }
    if (map.getLayer(ROUTE_GLOW_LAYER_ID)) {
      map.removeLayer(ROUTE_GLOW_LAYER_ID);
    }
    if (map.getSource(ROUTE_SOURCE_ID)) {
      map.removeSource(ROUTE_SOURCE_ID);
    }
  }

  function stopRouteAnimation() {
    if (routeAnimationRef.current) {
      clearInterval(routeAnimationRef.current);
      routeAnimationRef.current = null;
    }
  }

  function startRouteAnimation(map: maplibregl.Map) {
    stopRouteAnimation();

    let progress = 0;
    routeAnimationRef.current = setInterval(() => {
      if (!map.getLayer(ROUTE_LAYER_ID)) {
        return;
      }

      progress = (progress + 0.03) % 1;
      const head = progress;
      const epsilon = 0.0001;
      const rawTail = Math.max(0, head - 0.18);
      const rawLead = Math.min(1, head + 0.08);

      const tail = Math.max(epsilon, rawTail);
      const animatedHead = Math.min(1 - 2 * epsilon, Math.max(tail + epsilon, head));
      const lead = Math.min(1 - epsilon, Math.max(animatedHead + epsilon, rawLead));

      map.setPaintProperty(ROUTE_LAYER_ID, "line-gradient", [
        "interpolate",
        ["linear"],
        ["line-progress"],
        0,
        "rgba(2,132,199,0.25)",
        tail,
        "rgba(2,132,199,0.25)",
        animatedHead,
        "rgba(34,211,238,1)",
        lead,
        "rgba(2,132,199,0.28)",
        1,
        "rgba(2,132,199,0.25)",
      ]);
    }, 64);
  }

  function add3DBuildings(map: maplibregl.Map) {
    if (map.getLayer(BUILDING_LAYER_ID)) {
      return;
    }

    const layers = map.getStyle().layers || [];
    const firstLabelLayerId = layers.find((layer) => layer.type === "symbol")?.id;
    const buildingLayer = layers.find((layer) => {
      const sourceLayer = (layer as { "source-layer"?: string })["source-layer"];
      return Boolean(sourceLayer && sourceLayer.toLowerCase().includes("building"));
    }) as
      | (maplibregl.StyleLayer & {
          source?: string;
          "source-layer"?: string;
        })
      | undefined;

    if (!buildingLayer?.source || !buildingLayer["source-layer"]) {
      return;
    }

    map.addLayer(
      {
        id: BUILDING_LAYER_ID,
        type: "fill-extrusion",
        source: buildingLayer.source,
        "source-layer": buildingLayer["source-layer"],
        minzoom: 13,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "render_height"],
            0,
            "#cbd5e1",
            60,
            "#94a3b8",
            180,
            "#64748b",
          ],
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 12],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.65,
        },
      },
      firstLabelLayerId
    );
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const startLat = Number.isFinite(accommodationLat)
      ? accommodationLat
      : DEFAULT_LAT;
    const startLon = Number.isFinite(accommodationLon)
      ? accommodationLon
      : DEFAULT_LON;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLE_URL,
      center: [startLon, startLat],
      zoom: 12,
      pitch: 56,
      bearing: -18,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const onLoad = () => {
      add3DBuildings(map);
      setMapLoaded(true);
    };

    map.on("load", onLoad);
    mapRef.current = map;

    return () => {
      removeStopMarkers();
      stopRouteAnimation();
      homeMarkerRef.current?.remove();
      homeMarkerRef.current = null;

      map.off("load", onLoad);
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [accommodationLat, accommodationLon]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;
    homeMarkerRef.current?.remove();

    const markerEl = document.createElement("div");
    markerEl.className = "ml-marker ml-marker-home";
    markerEl.innerHTML = '<span class="ml-marker-home-glyph">H</span>';

    homeMarkerRef.current = new maplibregl.Marker({ element: markerEl })
      .setLngLat([accommodationLon, accommodationLat])
      .setPopup(
        new maplibregl.Popup({ offset: 18 }).setHTML(
          `<strong>${accommodationName}</strong><br>Starting Point`
        )
      )
      .addTo(map);
  }, [mapLoaded, accommodationName, accommodationLat, accommodationLon]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;
    removeStopMarkers();

    visiblePlaces.forEach((place, index) => {
      const markerEl = document.createElement("div");
      markerEl.className = "ml-marker ml-marker-stop";
      markerEl.textContent = String(index + 1);

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            `<strong>${place.name}</strong><br>${place.category || "Activity"}`
          )
        )
        .addTo(map);

      stopMarkersRef.current.push(marker);
    });

    const coordinates: [number, number][] = [
      [accommodationLon, accommodationLat],
      ...visiblePlaces.map((place) => [place.longitude, place.latitude] as [number, number]),
    ];

    if (coordinates.length >= 2) {
      const routeData = {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            geometry: {
              type: "LineString" as const,
              coordinates,
            },
            properties: {},
          },
        ],
      };

      const existingSource = map.getSource(ROUTE_SOURCE_ID);
      if (isGeoJsonSource(existingSource)) {
        existingSource.setData(routeData);
      } else {
        removeRouteLayers(map);
        map.addSource(ROUTE_SOURCE_ID, {
          type: "geojson",
          data: routeData,
          lineMetrics: true,
        });

        map.addLayer({
          id: ROUTE_GLOW_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          paint: {
            "line-color": "#22d3ee",
            "line-width": 9,
            "line-opacity": 0.2,
          },
        });

        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          paint: {
            "line-color": "#0284c7",
            "line-width": 4,
            "line-opacity": 0.9,
            "line-gradient": [
              "interpolate",
              ["linear"],
              ["line-progress"],
              0,
              "rgba(2,132,199,0.25)",
              1,
              "rgba(2,132,199,0.25)",
            ],
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
        });
      }

      startRouteAnimation(map);
    } else {
      stopRouteAnimation();
      removeRouteLayers(map);
    }

    if (visiblePlaces.length === 0) {
      map.easeTo({
        center: [accommodationLon, accommodationLat],
        zoom: 12,
        pitch: 56,
        bearing: -18,
        duration: 950,
        essential: true,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds(
      [accommodationLon, accommodationLat],
      [accommodationLon, accommodationLat]
    );
    coordinates.forEach((coordinate) => bounds.extend(coordinate));

    map.fitBounds(bounds, {
      duration: 1200,
      maxZoom: 13,
      essential: true,
      padding: {
        top: 90,
        right: 90,
        bottom: 150,
        left: 90,
      },
    });

    const currentBearing = (dayIndex * 12 + activityIndex * 3) % 360;
    map.easeTo({
      pitch: 60,
      bearing: -20 + currentBearing * 0.08,
      duration: 1100,
      essential: true,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapLoaded,
    visiblePlaces,
    accommodationLat,
    accommodationLon,
    accommodationName,
    dayIndex,
    activityIndex,
  ]);

  return (
    <div className="relative h-[520px]">
      <div ref={mapContainerRef} className="h-full w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white z-[900]">
          <Icon name="sync" className="size-5 animate-spin" />
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white rounded-xl shadow-lg p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Icon name="hotel" className="size-4 text-primary" />
            <span className="truncate max-w-[180px]">{accommodationName}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2 flex-wrap">
              {itinerary.map((day, index) => (
                <button
                  key={day.day}
                  className={classNames(
                    "day-pill px-4 py-2 rounded-full text-sm font-bold text-slate-600 bg-slate-100",
                    index === dayIndex && "active"
                  )}
                  onClick={() => onSelectDay(index)}
                >
                  Day {index + 1}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={onPrevDay} disabled={dayIndex === 0} className="map-control-btn">
                <Icon name="chevron_left" className="size-4 text-slate-600" />
              </button>
              <button onClick={onToggleAutoPlay} className="play-btn">
                <Icon name={autoPlay ? "pause" : "play_arrow"} className="size-5" />
              </button>
              <button
                onClick={onNextDay}
                disabled={dayIndex >= itinerary.length - 1}
                className="map-control-btn"
              >
                <Icon name="chevron_right" className="size-4 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="timeline-progress">
            <div className="timeline-progress-bar" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="flag" className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Current activity</p>
              <p className="font-bold text-slate-800">{currentActivityName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
