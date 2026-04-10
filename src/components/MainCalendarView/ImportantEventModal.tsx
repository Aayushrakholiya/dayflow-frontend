/*  
*  FILE          : ImportantEventModal.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Modal for viewing and editing imported calendar event details.
*/ 

import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import type {
  ImportedCalendarEvent,
  CalendarProvider,
} from "./CalendarImportService";
import { updateImportedEventLocation } from "./CalendarImportService";
import {
  getAutocompleteSuggestions,
  type AutocompleteResult,
  type LatLng,
} from "../LocationServices/LocationService";
import styles from "./ImportedEventModal.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatHour12(h: number): string {
  const totalMins = Math.round(h * 60);
  const h24 = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  const period = h24 < 12 ? "AM" : "PM";
  return `${hour}:${String(mins).padStart(2, "0")} ${period}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Source badge ──────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: CalendarProvider }) {
  return (
    <span
      className={`${styles.sourceBadge} ${source === "google" ? styles.sourceBadgeGoogle : styles.sourceBadgeMicrosoft}`}
    >
      {source === "google" ? (
        <>
          <GoogleDot /> Google Calendar
        </>
      ) : (
        <>
          <MicrosoftDot /> Microsoft Calendar
        </>
      )}
    </span>
  );
}

function GoogleDot() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={styles.badgeIcon}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MicrosoftDot() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={styles.badgeIcon}
    >
      <path fill="#F35325" d="M1 1h10v10H1z" />
      <path fill="#81BC06" d="M13 1h10v10H13z" />
      <path fill="#05A6F0" d="M1 13h10v10H1z" />
      <path fill="#FFBA08" d="M13 13h10v10H13z" />
    </svg>
  );
}

// ── Location autocomplete input ───────────────────────────────────────────────

interface LocationInputProps {
  value: string;
  onChange: (val: string, coords?: LatLng) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  userCoords?: LatLng | null;
}

function LocationAutocompleteInput({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
  userCoords,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await getAutocompleteSuggestions(
          val,
          userCoords ?? undefined,
          "CA",
        );
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
  }

  function handleSelect(suggestion: AutocompleteResult) {
    onChange(suggestion.description, suggestion.coords);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  return (
    <div ref={wrapRef} className={styles.autocompleteWrap}>
      <input
        type="text"
        className={styles.locationInput}
        value={value}
        onChange={handleInput}
        placeholder="Search for a location…"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
      />

      {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
        <div className={styles.suggestionsList}>
          {loadingSuggestions && (
            <div className={styles.suggestionsLoading}>Searching…</div>
          )}
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              className={styles.suggestionItem}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              <span className={styles.suggestionPin}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" /><path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" /><path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" /></svg></span>
              <div className={styles.suggestionText}>
                <span className={styles.suggestionMain}>{s.mainText}</span>
                <span className={styles.suggestionSub}>{s.secondaryText}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}

      <div className={styles.locationActions}>
        <button
          type="button"
          className={styles.saveLocationBtn}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className={styles.cancelLocationBtn}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ImportedEventModalProps {
  event: ImportedCalendarEvent;
  userId: string | number;
  position?: { top: number; left: number } | null;
  onClose: () => void;
  onLocationUpdated: (updated: ImportedCalendarEvent) => void;
  onViewLocation?: (location: string) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export default function ImportedEventModal({
  event,
  userId,
  position,
  onClose,
  onLocationUpdated,
  onViewLocation,
  userCoords,
}: ImportedEventModalProps) {
  const originalLocation = event.location ?? null;
  const currentOverride =
    event.locationOverride && event.locationOverride !== event.location
      ? event.locationOverride
      : null;

  const effectiveLocation = currentOverride ?? originalLocation ?? "";
  const canEditLocation = !originalLocation;
  const [locationValue, setLocationValue] = useState(currentOverride ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setLocationError(null);
    try {
      const trimmed = locationValue.trim() || null;
      const updated = await updateImportedEventLocation(
        event.id,
        userId,
        trimmed,
      );
      onLocationUpdated(updated);
      setIsEditing(false);
    } catch {
      setLocationError("Failed to save location. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocationValue(currentOverride ?? "");
    setLocationError(null);
    setIsEditing(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderLocationContent = () => {
    if (originalLocation) {
      return (
        <div className={styles.locationReadOnly}>
          <span className={styles.locationText}>{originalLocation}</span>
          {onViewLocation && (
            <button
              type="button"
              className={styles.viewMapBtn}
              onClick={() => onViewLocation(originalLocation)}
            >
              🗺️ View on Map
            </button>
          )}
        </div>
      );
    }

    // Case 2: editing override with autocomplete
    if (isEditing) {
      return (
        <LocationAutocompleteInput
          value={locationValue}
          onChange={(val) => {
            setLocationValue(val);
          }}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
          error={locationError}
          userCoords={userCoords}
        />
      );
    }

    // Case 3: no original location — show override or prompt
    return (
      <div className={styles.locationEditableWrap}>
        <span
          className={`${styles.locationValue} ${!effectiveLocation ? styles.locationEmpty : ""}`}
          onClick={() => setIsEditing(true)}
          title="Click to add location"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsEditing(true)}
        >
          {effectiveLocation || "Add location…"}
          <span className={styles.editHint}>✏️</span>
          {currentOverride && (
            <span className={styles.overrideBadge}>custom</span>
          )}
        </span>
        {effectiveLocation && onViewLocation && (
          <button
            type="button"
            className={styles.viewMapBtn}
            onClick={() => onViewLocation(effectiveLocation)}
          >
            🗺️ Map
          </button>
        )}
      </div>
    );
  };

  const modal = (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div
        className={styles.modal}
        ref={(el) => {
          if (el && position) {
            el.style.setProperty("--modal-top", `${position.top}px`);
            el.style.setProperty("--modal-left", `${position.left}px`);
            el.classList.add(styles.modalPositioned);
          }
        }}
      >
        <div className={styles.header}>
          <SourceBadge source={event.source} />
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <h2 className={styles.title}>{event.title}</h2>
        <p className={styles.calendarName}>{event.calendarName}</p>

        <div className={styles.row}>
          <span className={styles.icon}>📅</span>
          <span className={styles.value}>
            {formatDate(event.date)}&nbsp;&nbsp;
            <span className={styles.timeRange}>
              {formatHour12(event.startHour)} – {formatHour12(event.endHour)}
            </span>
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.icon}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" /><path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" /><path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" /></svg></span>
          <div className={styles.locationWrap}>{renderLocationContent()}</div>
        </div>

        {event.attendees && event.attendees.length > 0 && (
          <div className={styles.row}>
            <span className={styles.icon}>👥</span>
            <div className={styles.attendeeList}>
              {event.attendees.map((a) => (
                <span key={a} className={styles.attendeeChip}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {event.videoconferencing && (
          <div className={styles.row}>
            <span className={styles.icon}>🎥</span>
            <a
              href={event.videoconferencing}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoLink}
            >
              Join meeting
            </a>
          </div>
        )}

        {event.description && (
          <div className={styles.row}>
            <span className={styles.icon}>📝</span>
            <p className={styles.description}>{event.description}</p>
          </div>
        )}

        <p className={styles.readOnlyNote}>
          {canEditLocation
            ? "This event is imported. Only location can be edited."
            : "This event is imported and view-only. Location is set by the calendar."}
        </p>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
