import { useCallback, useEffect, useRef, useState } from "react";
import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";
import {
  getUserLocation,
  getETA,
  getPlaceDetails,
  geocodeAddress,
  getMapsUrl,
  type ETAResult,
  type PlaceDetails,
  type TravelMode,
  type LatLng,
} from "../LocationServices/LocationService";
import styles from "./LocationPanel.module.css";

// ── Leaflet CDN loader ────────────────────────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
  }
}

function loadLeaflet(): Promise<void> {
  return new Promise((resolve) => {
    if (globalThis.L) return resolve();
    if (!document.querySelector("#leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.querySelector("#leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve();
      document.head.appendChild(script);
    } else {
      const check = setInterval(() => {
        if (globalThis.L) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    }
  });
}

// ── Config ────────────────────────────────────────────────────────────────────

const MODES: { mode: TravelMode; icon: string; label: string }[] = [
  { mode: "DRIVING", icon: "🚗", label: "Drive" },
  { mode: "WALKING", icon: "🚶", label: "Walk" },
  { mode: "TRANSIT", icon: "🚌", label: "Transit" },
  { mode: "BICYCLING", icon: "🚴", label: "Cycle" },
];

const MODE_COLOR: Record<TravelMode, string> = {
  DRIVING: "#3b78f5",
  WALKING: "#3e9e5f",
  TRANSIT: "#7c3aed",
  BICYCLING: "#f0603a",
};

function stepIcon(type: number): string {
  switch (type) {
    case 0:
    case 2:
    case 4:
    case 12:
      return "↰";
    case 1:
    case 3:
    case 5:
    case 13:
      return "↱";
    case 6:
    case 11:
      return "↑";
    case 7:
    case 8:
      return "↪";
    case 9:
      return "⬆";
    case 10:
      return "📍";
    default:
      return "•";
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface LocationPanelProps {
  event: CalendarEvent;
  onClose: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LocationPanel({
  event,
  onClose,
  userCoords: userCoordsProp,
}: LocationPanelProps) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [travelMode, setTravelMode] = useState<TravelMode>(() => {
    try {
      return (
        (localStorage.getItem("preferred_travel_mode") as TravelMode) ||
        "DRIVING"
      );
    } catch {
      return "DRIVING";
    }
  });

  const [eta, setEta] = useState<ETAResult | null>(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [etaError, setEtaError] = useState<string | null>(null);

  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [destCoords, setDestCoords] = useState<LatLng | null>(null);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const destMarkerRef = useRef<any>(null);
  const leafletReadyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasLocation = !!event.location?.trim();

  // ── Escape key ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    globalThis.addEventListener("keydown", h);
    return () => globalThis.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Get user GPS ──
  const gpsFetchedRef = useRef(false);
  useEffect(() => {
    if (userCoordsProp) {
      setUserLocation(userCoordsProp);
      gpsFetchedRef.current = true;
      return;
    }
    if (gpsFetchedRef.current) return;
    gpsFetchedRef.current = true;
    getUserLocation()
      .then(setUserLocation)
      .catch((err: Error) => setLocationError(err.message));
  }, [userCoordsProp]);

  // ── Geocode destination (fallback before ETA resolves destCoords) ──
  useEffect(() => {
    if (!hasLocation) return;
    if (place?.location?.lat) {
      setDestCoords(place.location);
      return;
    }
    geocodeAddress(event.location, "CA")
      .then((c) => {
        if (c) setDestCoords(c);
      })
      .catch(() => {});
  }, [event.location, hasLocation, place]);

  // ── Fetch ETA + route (debounced 400 ms) ──
  const fetchETA = useCallback(async () => {
    if (!userLocation || !hasLocation) return;
    setEtaLoading(true);
    setEta(null);
    setEtaError(null);
    try {
      const result = await getETA(
        userLocation,
        destCoords ?? event.location,
        event.startHour,
        travelMode,
      );
      setEta(result);
      if (result.destCoords) setDestCoords(result.destCoords);
    } catch (err) {
      setEtaError(
        err instanceof Error ? err.message : "Failed to calculate route.",
      );
    } finally {
      setEtaLoading(false);
    }
  }, [
    userLocation,
    event.location,
    event.startHour,
    travelMode,
    hasLocation,
    destCoords,
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchETA, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchETA]);

  // ── Fetch place details ──
  useEffect(() => {
    if (!hasLocation) return;
    let cancelled = false;
    setPlaceLoading(true);
    getPlaceDetails(event.location, "CA")
      .then((p) => {
        if (!cancelled) setPlace(p);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPlaceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [event.location, hasLocation]);

  // ── Initialise Leaflet map (once on mount) ──
  useEffect(() => {
    if (!hasLocation || !mapContainerRef.current) return;
    loadLeaflet().then(() => {
      const L = globalThis.L;
      if (!mapContainerRef.current || mapRef.current) return;
      const centre: [number, number] = destCoords
        ? [destCoords.lat, destCoords.lng]
        : [56.1304, -106.3468]; // Canada
      const map = L.map(mapContainerRef.current, {
        center: centre,
        zoom: destCoords ? 14 : 4,
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      leafletReadyRef.current = true;
    });
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        leafletReadyRef.current = false;
        userMarkerRef.current = null;
        destMarkerRef.current = null;
        routeLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLocation]);

  // ── Draw/update markers + route polyline whenever data changes ──
  useEffect(() => {
    if (!leafletReadyRef.current || !mapRef.current) return;
    const L = globalThis.L;
    const map = mapRef.current;

    // User location — blue pulsing dot
    if (userLocation) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#3b78f5;border:2.5px solid white;
          box-shadow:0 0 0 5px rgba(59,120,245,0.22);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon,
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup("📍 You are here");
      }
    }

    // Destination — coral teardrop pin
    if (destCoords) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:22px;height:22px;border-radius:50% 50% 50% 0;
          background:#f0603a;border:2.5px solid white;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(240,96,58,0.55);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });
      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([destCoords.lat, destCoords.lng]);
      } else {
        destMarkerRef.current = L.marker([destCoords.lat, destCoords.lng], {
          icon,
          zIndexOffset: 900,
        })
          .addTo(map)
          .bindPopup(`📌 ${place?.name ?? event.location}`);
      }
    }

    // Route polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (eta?.routeGeometry && eta.routeGeometry.length > 1) {
      const color = MODE_COLOR[travelMode];
      const isDashed = travelMode === "WALKING" || travelMode === "TRANSIT";
      routeLayerRef.current = L.polyline(eta.routeGeometry, {
        color,
        weight: travelMode === "WALKING" ? 4 : 5,
        opacity: 0.9,
        dashArray: isDashed ? "10, 7" : undefined,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);

      // Fit bounds to show full route + user location
      const allPoints: [number, number][] = [...eta.routeGeometry];
      if (userLocation) allPoints.push([userLocation.lat, userLocation.lng]);
      map.fitBounds(L.latLngBounds(allPoints), { padding: [36, 36] });
    } else if (destCoords && userLocation) {
      map.fitBounds(
        L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [destCoords.lat, destCoords.lng],
        ]),
        { padding: [44, 44] },
      );
    } else if (destCoords) {
      map.setView([destCoords.lat, destCoords.lng], 15);
    }
  }, [userLocation, destCoords, eta, travelMode, place, event.location]);

  // ── OSM directions deep-link ──
  const mapsUrl = getMapsUrl(
    event.location,
    destCoords ?? undefined,
    userLocation ?? undefined,
    travelMode,
  );

  const showSteps =
    (travelMode === "WALKING" || travelMode === "BICYCLING") &&
    (eta?.steps?.length ?? 0) > 0;

  // ── Empty state ──
  if (!hasLocation) {
    return (
      <div className={styles.panel} role="dialog" aria-label="Location details">
        <div className={styles.header}>
          <span className={styles.headerTitle}>📍 Location</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🗺️</div>
          <div className={styles.emptyText}>No location set for this event</div>
          <div className={styles.emptyHint}>
            Add a location when editing the event to see ETA and directions.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel} role="dialog" aria-label="Location details">
      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>📍 Location</span>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* ── Event chip ── */}
      <div className={styles.eventChip}>
        <span
          className={styles.eventDot}
          style={{ background: event.color || "#F0603A" }}
        />
        <div className={styles.eventChipText}>
          <span className={styles.eventChipTitle}>{event.title}</span>
          <span className={styles.eventChipLocation}>
            {placeLoading
              ? "Resolving place…"
              : (place?.name ?? event.location)}
          </span>
        </div>
      </div>

      {/* ── Leaflet map ── */}
      <div className={styles.mapWrap}>
        <div ref={mapContainerRef} className={styles.leafletMap} />
        {!destCoords && (
          <div className={styles.mapSpinnerOverlay}>
            <div className={styles.etaSpinner} />
          </div>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openMapsLink}
        >
          Open route in OSM ↗
        </a>
      </div>

      {/* ── Travel mode switcher ── */}
      <div className={styles.modeRow}>
        {MODES.map(({ mode, icon, label }) => (
          <button
            key={mode}
            className={`${styles.modeBtn} ${travelMode === mode ? styles.modeBtnActive : ""}`}
            style={
              travelMode === mode
                ? {
                    borderColor: MODE_COLOR[mode],
                    background: `${MODE_COLOR[mode]}18`,
                  }
                : {}
            }
            onClick={() => {
              setTravelMode(mode);
              try {
                localStorage.setItem("preferred_travel_mode", mode);
              } catch {
                /* private */
              }
            }}
            aria-label={label}
            title={label}
          >
            <span className={styles.modeBtnIcon}>{icon}</span>
            <span
              className={styles.modeBtnLabel}
              style={travelMode === mode ? { color: MODE_COLOR[mode] } : {}}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ── ETA card ── */}
      <div className={styles.etaCard}>
        {locationError ? (
          <div className={styles.etaError}>
            <span className={styles.etaErrorIcon}>⚠️</span>
            <span>Location access denied. Enable GPS to see ETA.</span>
          </div>
        ) : etaLoading || !userLocation ? (
          <div className={styles.etaLoading}>
            <div className={styles.etaSpinner} />
            <span>Calculating route…</span>
          </div>
        ) : etaError ? (
          <div className={styles.etaError}>
            <span className={styles.etaErrorIcon}>⚠️</span>
            <span>{etaError}</span>
          </div>
        ) : eta ? (
          <>
            <div className={styles.etaMain}>
              <div className={styles.etaTime}>
                {eta.trafficDurationText ?? eta.durationText}
              </div>
              <div className={styles.etaDist}>{eta.distanceText}</div>
            </div>
            {eta.trafficDurationText &&
              eta.trafficDurationText !== eta.durationText && (
                <div className={styles.trafficNote}>
                  🚦 Heavy traffic detected
                  <span className={styles.normalTime}>
                    {" "}
                    (normally {eta.durationText})
                  </span>
                </div>
              )}
            <div className={styles.departByRow}>
              <span className={styles.departByIcon}>⏰</span>
              <span className={styles.departByText}>{eta.departByText}</span>
            </div>
          </>
        ) : (
          <div className={styles.etaError}>
            <span className={styles.etaErrorIcon}>❓</span>
            <span>Could not calculate route to this location.</span>
          </div>
        )}
      </div>

      {/* ── Step-by-step directions (walk & cycle only) ── */}
      {showSteps && (
        <div className={styles.stepsCard}>
          <div className={styles.stepsHeader}>
            <span className={styles.stepsHeaderIcon}>
              {travelMode === "WALKING" ? "🚶" : "🚴"}
            </span>
            <span className={styles.stepsHeaderText}>
              Step-by-step directions
            </span>
          </div>
          <ol className={styles.stepsList}>
            {eta!.steps!.map((step, i) => (
              <li key={i} className={styles.stepItem}>
                <span className={styles.stepIcon}>{stepIcon(step.type)}</span>
                <div className={styles.stepBody}>
                  <span className={styles.stepInstruction}>
                    {step.instruction}
                  </span>
                  <span className={styles.stepMeta}>{step.distanceText}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Place details ── */}
      {place &&
        (place.formattedAddress ||
          place.isOpen !== null ||
          place.openingHoursText) && (
          <div className={styles.placeDetailsCard}>
            {place.formattedAddress && (
              <div className={styles.placeDetailRow}>
                <span className={styles.placeDetailIcon}>📌</span>
                <span className={styles.placeDetailText}>
                  {place.formattedAddress}
                </span>
              </div>
            )}
            {place.isOpen !== null && (
              <div className={styles.placeDetailRow}>
                <span className={styles.placeDetailIcon}>🕐</span>
                <span
                  className={styles.placeDetailText}
                  style={{
                    fontWeight: 700,
                    color: place.isOpen ? "#3E9E5F" : "#E53E3E",
                  }}
                >
                  {place.isOpen ? "Open now" : "Closed now"}
                </span>
              </div>
            )}
            {place.openingHoursText && (
              <div className={styles.placeDetailRow}>
                <span className={styles.placeDetailIcon}>📋</span>
                <span
                  className={styles.placeDetailText}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {place.openingHoursText}
                </span>
              </div>
            )}
            {place.rating != null && (
              <div className={styles.placeDetailRow}>
                <span className={styles.placeDetailIcon}>⭐</span>
                <span className={styles.placeDetailText}>
                  {place.rating} / 5
                </span>
              </div>
            )}
            {place.phone && (
              <div className={styles.placeDetailRow}>
                <span className={styles.placeDetailIcon}>📞</span>
                <a
                  href={`tel:${place.phone}`}
                  className={styles.placeDetailLink}
                >
                  {place.phone}
                </a>
              </div>
            )}
            {(place as { website?: string | null }).website && (
              <div className={styles.placeDetailRow}>
                <span className={styles.placeDetailIcon}>🌐</span>
                <a
                  href={(place as { website?: string }).website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.placeDetailLink}
                >
                  Visit website
                </a>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
