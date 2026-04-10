/*  
*  FILE          : UseEventETA.ts 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Custom hook that fetches ETA for calendar events based on current location and travel mode.
*/

import { useState, useEffect } from "react";
import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";
import {
  getUserLocation,
  getETA,
  type ETAResult,
  type TravelMode,
} from "../LocationServices/LocationService";

export function useEventETA(
  event: CalendarEvent,
  mode?: TravelMode,
): { eta: ETAResult | null; loading: boolean; error: string | null } {
  // Use the provided mode or fall back to the saved preference in localStorage
  const resolvedMode: TravelMode =
    mode ??
    (() => {
      try {
        return (
          (localStorage.getItem("preferred_travel_mode") as TravelMode) ||
          "DRIVING"
        );
      } catch {
        return "DRIVING";
      }
    })();

  const [eta, setEta] = useState<ETAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build a stable key from coords so the effect re-runs only when they change
  const coordsKey = event.locationCoords
    ? `${event.locationCoords.lat},${event.locationCoords.lng}`
    : null;

  useEffect(() => {
    if (!event.location?.trim()) return;
    let cancelled = false;
    setLoading(true);
    setEta(null);
    setError(null);

    (async () => {
      try {
        const userCoords = await getUserLocation();
        if (cancelled) return;

        // Use coords directly if available — avoids an extra geocode round-trip
        const destination: { lat: number; lng: number } | string =
          event.locationCoords ?? event.location;

        const result = await getETA(
          userCoords,
          destination,
          event.startHour,
          resolvedMode,
        );
        if (!cancelled) setEta(result);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to get ETA");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // coordsKey changes when locationCoords change; event.location for manual edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.location, coordsKey, event.startHour, resolvedMode]);

  return { eta, loading, error };
}
