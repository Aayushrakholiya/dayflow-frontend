// LocationService.ts
// Browser-side only: geolocation + URL helpers.

// ─── Public types ─────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export type TravelMode = "DRIVING" | "WALKING" | "TRANSIT" | "BICYCLING";

export interface RouteStep {
  instruction: string;
  distanceText: string;
  durationText: string;
  type: number;
}

export interface ETAResult {
  durationText: string;
  durationSeconds: number;
  distanceText: string;
  distanceMeters: number;
  departByText: string;
  trafficDurationText?: string;
  mode: TravelMode;
  routeGeometry?: [number, number][];
  destCoords?: { lat: number; lng: number };
  steps?: RouteStep[];
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: LatLng;
  isOpen: boolean | null;
  openingHoursText: string | null;
  rating: number | null;
  phone: string | null;
  website: string | null;
  mapsUrl: string;
}

export interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  coords: LatLng;
}

// ─── User Geolocation (browser-only, no API key) ──────────────────────────────

export function getUserLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(`Geolocation error: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

const OSM_ROUTE_MODE: Record<TravelMode, string> = {
  DRIVING: "fossgis_osrm_car",
  WALKING: "fossgis_osrm_foot",
  BICYCLING: "fossgis_osrm_bike",
  TRANSIT: "fossgis_osrm_car",
};

export function getMapsUrl(
  location: string,
  coords?: LatLng,
  originCoords?: LatLng,
  mode: TravelMode = "DRIVING",
): string {
  if (originCoords && coords) {
    const engine = OSM_ROUTE_MODE[mode];
    return (
      `https://www.openstreetmap.org/directions?engine=${engine}&route=` +
      `${originCoords.lat}%2C${originCoords.lng}%3B${coords.lat}%2C${coords.lng}`
    );
  }
  if (coords) {
    return (
      `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}` +
      `#map=15/${coords.lat}/${coords.lng}`
    );
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(location)}`;
}

// ─── Backend-proxied calls ────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─── Route cache (5 min TTL — prevents hammering ORS on re-renders) ──────────

const routeCache = new Map<string, { result: ETAResult; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(
  origin: LatLng,
  destination: string | LatLng,
  hour: number,
  mode: TravelMode,
): string {
  const destStr =
    typeof destination === "string"
      ? destination
      : `${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  return `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}|${destStr}|${hour}|${mode}`;
}

export async function getETA(
  origin: LatLng,
  destination: string | LatLng,
  eventStartHour: number,
  mode: TravelMode = "DRIVING",
): Promise<ETAResult> {
  const key = cacheKey(origin, destination, eventStartHour, mode);
  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.result;
  }

  const res = await fetch(`${API_URL}/api/location/eta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination, eventStartHour, mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Failed to calculate route.",
    );
  }
  const result = (await res.json()) as ETAResult;
  routeCache.set(key, { result, ts: Date.now() });
  return result;
}

export async function geocodeAddress(
  address: string,
  countryCode: string = "CA",
): Promise<LatLng | null> {
  const res = await fetch(
    `${API_URL}/api/location/geocode?address=${encodeURIComponent(address)}&country=${encodeURIComponent(countryCode)}`,
  );
  if (!res.ok) return null;
  return res.json() as Promise<LatLng>;
}

export async function getPlaceDetails(
  locationText: string,
  countryCode: string = "CA",
): Promise<PlaceDetails | null> {
  const res = await fetch(
    `${API_URL}/api/location/place?q=${encodeURIComponent(locationText)}&country=${encodeURIComponent(countryCode)}`,
  );
  if (!res.ok) return null;
  return res.json() as Promise<PlaceDetails>;
}

export async function getAutocompleteSuggestions(
  input: string,
  userCoords?: LatLng,
  countryCode: string = "CA",
): Promise<AutocompleteResult[]> {
  if (!input.trim()) return [];
  let url = `${API_URL}/api/location/autocomplete?q=${encodeURIComponent(input)}`;
  if (userCoords) url += `&lat=${userCoords.lat}&lng=${userCoords.lng}`;
  if (countryCode) url += `&country=${encodeURIComponent(countryCode)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Autocomplete failed:", res.status, err);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("Autocomplete returned non-array:", data);
      return [];
    }
    return data as AutocompleteResult[];
  } catch (err) {
    console.error("Autocomplete fetch error:", err);
    return [];
  }
}
