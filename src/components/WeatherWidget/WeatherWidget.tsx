/*  
*  FILE          : WeatherWidget.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Weather widget displaying current conditions and forecast with location-based auto-refresh.
*/ 

import { useState, useEffect, useCallback } from "react";
import * as Popover from "@radix-ui/react-popover";
import styles from "./WeatherWidget.module.css";
import { useLocationPermission } from "../LocationServices/useLocationPermission";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Must stay in sync with WeatherResponse in backend/src/weather.ts
interface WeatherTip {
  text: string;
  emoji: string;
}

export interface ForecastDay {
  label: string;
  tempHighC: number | null;
  tempLowC: number | null;
  tempHighF: number | null;
  tempLowF: number | null;
  icon: string;
  desc: string;
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
  forecast: ForecastDay[];
  source: "MSC GeoMet";
  attribution: string | null;
}

// Returns the right temperature string for the active unit.
// No math needed — the backend already sent both values.
function pickTemp(c: number | null, f: number | null, unit: "C" | "F"): string {
  const val = unit === "C" ? c : f;
  return val === null ? "—" : `${val}°${unit}`;
}

interface WeatherWidgetProps {
  onForecastLoad?: (data: { forecast: ForecastDay[]; city: string }) => void;
}

export default function WeatherWidget({ onForecastLoad }: WeatherWidgetProps = {}) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use the shared hook so the browser only prompts for location once
  const { state: locState, coords } = useLocationPermission();

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
      const weatherData = await res.json() as WeatherData;
      setWeather(weatherData);
      onForecastLoad?.({ forecast: weatherData.forecast, city: weatherData.city });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load weather.");
    } finally {
      setLoading(false);
    }
  }, []);

  // React to the resolved location state instead of requesting geolocation directly.
  useEffect(() => {
    if (locState === "granted" && coords) {
      loadWeather(coords.lat, coords.lng);
    } else if (locState === "denied") {
      setError("Location denied.");
      setLoading(false);
    }
  }, [locState, coords, loadWeather]);

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

// Mirrors the backend buildTip logic for forecast day popovers.
// Called on the frontend because forecast days have no server-generated tip.
function deriveForecastTip(tempHighC: number | null, desc: string): WeatherTip {
  const d = desc.toLowerCase();
  if (d.includes("thunder")) return { text: "Thunderstorm expected — plan accordingly.", emoji: "⚡" };
  if (d.includes("blizzard")) return { text: "Blizzard forecast — avoid travel if possible.", emoji: "🌨️" };
  if (d.includes("snow") || d.includes("flurr")) return { text: "Snow expected — layer up!", emoji: "🧣" };
  if (d.includes("rain") || d.includes("shower") || d.includes("drizzle")) return { text: "Rainy day ahead — grab your umbrella!", emoji: "☂️" };
  if (d.includes("fog") || d.includes("mist")) return { text: "Foggy conditions expected — drive carefully.", emoji: "🚗" };
  if (d.includes("wind") || d.includes("breezy")) return { text: "Windy day ahead — hold onto your hat!", emoji: "💨" };
  if (tempHighC !== null) {
    if (tempHighC <= -20) return { text: "Extreme cold forecast — limit time outside.", emoji: "🥶" };
    if (tempHighC <= 0)   return { text: "Freezing tomorrow — bundle up completely!", emoji: "🧤" };
    if (tempHighC <= 8)   return { text: "Cold day ahead — don't forget your coat.", emoji: "🧥" };
    if (tempHighC <= 15)  return { text: "Chilly tomorrow — a light jacket will do.", emoji: "🧶" };
    if (tempHighC >= 35)  return { text: "Heat wave coming — stay hydrated!", emoji: "💧" };
    if (tempHighC >= 28)  return { text: "Hot day ahead — apply sunscreen.", emoji: "🕶️" };
  }
  if (d.includes("clear") || d.includes("sunny")) return { text: "Looks like a beautiful day!", emoji: "😎" };
  return { text: "Mild and pleasant conditions expected.", emoji: "🌿" };
}

// Clickable pill shown above forecast day columns in the calendar header.
// Opens a popover detail card in the same style as the main WeatherWidget.
export function WeatherForecastPill({
  day,
  city,
}: {
  day: ForecastDay;
  city: string;
}) {
  const [unit, setUnit] = useState<"C" | "F">("C");
  const tip = deriveForecastTip(day.tempHighC, day.desc);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={styles.pillWrapper}
          aria-label={`Show forecast for ${day.label}`}
        >
          <div
            className={styles.pill}
            aria-label={`${day.desc}, high ${pickTemp(day.tempHighC, day.tempHighF, unit)}`}
          >
            <span className={styles.pillIcon} aria-hidden="true">{day.icon}</span>
            <span className={styles.pillTemp}>{pickTemp(day.tempHighC, day.tempHighF, unit)}</span>
          </div>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={12} align="center" className={styles.popoverContent}>
          <div className={styles.card}>

            {/* City name and day label on the left, unit toggle and close on the right */}
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <span className={styles.cardCity}>{city}</span>
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
                <Popover.Close className={styles.closeBtn} aria-label="Close forecast details">
                  ✕
                </Popover.Close>
              </div>
            </div>

            {/* Large icon beside the forecast high temperature and condition */}
            <div className={styles.cardMain}>
              <span className={styles.cardIcon} aria-hidden="true">{day.icon}</span>
              <div className={styles.cardTempBlock}>
                <span
                  className={styles.cardTemp}
                  aria-label={`High: ${pickTemp(day.tempHighC, day.tempHighF, unit)}`}
                >
                  {pickTemp(day.tempHighC, day.tempHighF, unit)}
                </span>
                <span className={styles.cardDesc}>{day.desc}</span>
              </div>
            </div>

            {/* Stat tiles: hi/lo for the forecast day; wind and humidity not available */}
            <div className={styles.cardStats} aria-label="Forecast statistics">
              {(day.tempHighC !== null || day.tempHighF !== null) && (
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    {pickTemp(day.tempHighC, day.tempHighF, unit)}
                    &nbsp;/&nbsp;
                    {pickTemp(day.tempLowC, day.tempLowF, unit)}
                  </span>
                  <span className={styles.statLabel}>Hi / Lo</span>
                </div>
              )}
              <div className={styles.statItem}>
                <span className={styles.statValue}>—</span>
                <span className={styles.statLabel}>Wind</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>—</span>
                <span className={styles.statLabel}>Humidity</span>
              </div>
            </div>

            {/* Tip derived on the frontend from the forecast condition and high temperature */}
            <div className={styles.tip} role="note">
              <span className={styles.tipEmoji} aria-hidden="true">{tip.emoji}</span>
              <span className={styles.tipText}>{tip.text}</span>
            </div>

          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}