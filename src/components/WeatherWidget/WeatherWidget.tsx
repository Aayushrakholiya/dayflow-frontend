import { useState, useEffect, useCallback } from "react";
import * as Popover from "@radix-ui/react-popover";
import styles from "./WeatherWidget.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Must stay in sync with WeatherResponse in backend/src/weather.ts
interface WeatherTip {
  text: string;
  emoji: string;
}

interface WeatherData {
  tempC: number | null;
  feelsC: number | null;
  tempMaxC: number | null;
  tempMinC: number | null;
  tempF: number | null;
  feelsF: number | null;
  tempMaxF: number | null;
  tempMinF: number | null;
  humidity: number | null;
  windKmh: number | null;
  desc: string;
  icon: string;
  tip: WeatherTip;
  city: string;
  source: "MSC GeoMet";
  attribution: string | null;
}

// Returns the right temperature string for the active unit.
// No math needed — the backend already sent both values.
function pickTemp(c: number | null, f: number | null, unit: "C" | "F"): string {
  const val = unit === "C" ? c : f;
  return val === null ? "—" : `${val}°${unit}`;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sends coordinates to the backend and stores the weather response.
  const loadWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? "Weather request failed.");
      }
      setWeather(await res.json() as WeatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load weather.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Ask the browser for location once when the component mounts.
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        setError("Location denied.");
        setLoading(false);
      },
    );
  }, [loadWeather]);

  // The pill is the compact chip always visible in the calendar header.
  // While loading it shows a shimmer skeleton.
  // If location is denied or the request fails it shows a globe and a dash.
  const renderPill = () => {
    if (loading) {
      return (
        <div className={styles.pillSkeleton} aria-label="Loading weather">
          <div className={styles.skeletonInner} />
        </div>
      );
    }
    if (error || !weather) {
      return (
        <div className={styles.pill} aria-label="Weather unavailable">
          <span className={styles.pillIcon}>🌐</span>
          <span className={styles.pillTemp}>—</span>
        </div>
      );
    }
    return (
      <div
        className={styles.pill}
        aria-label={`${weather.desc}, ${pickTemp(weather.tempC, weather.tempF, unit)}`}
      >
        <span className={styles.liveDot} aria-hidden="true" />
        <span className={styles.pillIcon} aria-hidden="true">{weather.icon}</span>
        <span className={styles.pillTemp}>{pickTemp(weather.tempC, weather.tempF, unit)}</span>
        <span className={styles.pillDesc}>{weather.desc}</span>
      </div>
    );
  };

  // The detail card opens inside a Radix Popover when the user clicks the pill.
  const renderDetailCard = () => {
    if (!weather) {
      return null;
    }
    return (
      <div className={styles.card}>

        {/* City name on the left, unit toggle and close button on the right */}
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleGroup}>
            <span className={styles.liveDotLarge} aria-hidden="true" />
            <span className={styles.cardCity}>{weather.city}</span>
          </div>
          <div className={styles.cardHeaderRight}>
            <button
              type="button"
              className={styles.unitToggle}
              onClick={() => setUnit(u => u === "C" ? "F" : "C")}
              aria-label={`Switch to ${unit === "C" ? "Fahrenheit" : "Celsius"}`}
            >
              °{unit === "C" ? "F" : "C"}
            </button>
            <Popover.Close className={styles.closeBtn} aria-label="Close weather details">
              ✕
            </Popover.Close>
          </div>
        </div>

        {/* Large icon beside the current temperature and condition description */}
        <div className={styles.cardMain}>
          <span className={styles.cardIcon} aria-hidden="true">{weather.icon}</span>
          <div className={styles.cardTempBlock}>
            <span
              className={styles.cardTemp}
              aria-label={`Temperature: ${pickTemp(weather.tempC, weather.tempF, unit)}`}
            >
              {pickTemp(weather.tempC, weather.tempF, unit)}
            </span>
            <span className={styles.cardDesc}>{weather.desc}</span>
            {(weather.feelsC !== null || weather.feelsF !== null) && (
              <span className={styles.cardFeels}>
                Feels like {pickTemp(weather.feelsC, weather.feelsF, unit)}
              </span>
            )}
          </div>
        </div>

        {/* Three stat tiles: forecast hi/lo, wind speed, and humidity */}
        <div className={styles.cardStats} aria-label="Weather statistics">
          {(weather.tempMaxC !== null || weather.tempMaxF !== null) && (
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {pickTemp(weather.tempMaxC, weather.tempMaxF, unit)}
                &nbsp;/&nbsp;
                {pickTemp(weather.tempMinC, weather.tempMinF, unit)}
              </span>
              <span className={styles.statLabel}>Hi / Lo</span>
            </div>
          )}
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {weather.windKmh !== null ? `${weather.windKmh} km/h` : "—"}
            </span>
            <span className={styles.statLabel}>Wind</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {weather.humidity !== null ? `${weather.humidity}%` : "—"}
            </span>
            <span className={styles.statLabel}>Humidity</span>
          </div>
        </div>

        {/* Short tip generated by the backend based on conditions and temperature */}
        <div className={styles.tip} role="note">
          <span className={styles.tipEmoji} aria-hidden="true">{weather.tip.emoji}</span>
          <span className={styles.tipText}>{weather.tip.text}</span>
        </div>

        {/* Attribution is required by ECCC Open Licence v2.1 */}
        {weather.attribution && (
          <p className={styles.attribution}>{weather.attribution}</p>
        )}
      </div>
    );
  };

  // The pill is always visible as the Popover trigger.
  // The detail card appears in a portal when the user clicks it.
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={styles.pillWrapper}
          aria-label="Show weather details"
          disabled={loading || !!error}
        >
          {renderPill()}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={12} align="end" className={styles.popoverContent}>
          {renderDetailCard()}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}