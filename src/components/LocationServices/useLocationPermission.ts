import { useEffect, useState } from "react";
import { getUserLocation, type LatLng } from "./LocationService";

type PermissionState = "idle" | "requesting" | "granted" | "denied";

export function useLocationPermission(): {
  state: PermissionState;
  coords: LatLng | null;
  request: () => void;
} {
  const [state, setState] = useState<PermissionState>("idle");
  const [coords, setCoords] = useState<LatLng | null>(null);

  // Check if permission was already granted in a previous session
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "granted") {
          setState("requesting");
          getUserLocation()
            .then((c) => {
              setCoords(c);
              setState("granted");
            })
            .catch(() => setState("denied"));
        } else if (result.state === "denied") {
          setState("denied");
        }
      })
      .catch(() => {}); // API not available in all browsers
  }, []);

  const request = () => {
    if (state === "granted" || state === "requesting") return;
    setState("requesting");
    getUserLocation()
      .then((c) => {
        setCoords(c);
        setState("granted");
      })
      .catch(() => setState("denied"));
  };

  return { state, coords, request };
}
