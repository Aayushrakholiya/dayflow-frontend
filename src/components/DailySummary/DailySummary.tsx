/*  
*  FILE          : DailySummary.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Component displaying daily summary with upcoming events, location info, ETA, and conflicts.
*/ 

import { useMemo, useState, useRef, useEffect, useCallback } from "react";

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" />
    <path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" />
    <path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" />
  </svg>
);
import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";
import type { ImportedCalendarEvent } from "../MainCalendarView/CalendarImportService";
import styles from "./DailySummary.module.css";
import { useEventETA } from "../LocationPanel/UseEventETA";
import { getPlaceDetails } from "../LocationServices/LocationService";
import { useConflictDetection } from "../Conflict/UseConflictDetection";
import type { UnifiedEvent, ConflictWarning } from "../Conflict/ConflictType";

// ── Formatting helpers ────────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");

const fmt12 = (h: number): string => {
  const total = Math.round(h * 60);
  const h24 = Math.floor(total / 60);
  const mins = total % 60;
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  const period = h24 < 12 ? "AM" : "PM";
  return `${hour}:${pad2(mins)} ${period}`;
};

const formatDuration = (startHour: number, endHour: number): string => {
  const totalMins = Math.round((endHour - startHour) * 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// ── Date helpers ──────────────────────────────────────────────────────────────

const toMidnight = (raw: Date | string): Date => {
  if (raw instanceof Date)
    return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  const iso = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const p = new Date(raw);
  return new Date(p.getFullYear(), p.getMonth(), p.getDate());
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const addDays = (d: Date, n: number): Date => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

const todayMidnight = (): Date => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const headingFull = (d: Date) =>
  d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const nowDecimal = () => {
  const n = new Date();
  return n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600;
};

// ── Status ────────────────────────────────────────────────────────────────────

type Status = "past" | "now" | "upcoming";

const getStatus = (e: UnifiedEvent, viewDate: Date, now: number): Status => {
  const today = todayMidnight();
  if (viewDate < today) return "past";
  if (viewDate > today) return "upcoming";
  if (e.endHour <= now) return "past";
  if (e.startHour <= now) return "now";
  return "upcoming";
};

// ── Converters ────────────────────────────────────────────────────────────────

function toUnified(e: CalendarEvent): UnifiedEvent {
  return {
    id: String(e.id),
    title: e.title,
    date: e.date instanceof Date ? e.date : new Date(e.date),
    startHour: e.startHour,
    endHour: e.endHour,
    location: e.location ?? "",
    color: e.color ?? "#6091F0",
    kind: e.kind ?? "event",
  };
}

function importedToUnified(e: ImportedCalendarEvent): UnifiedEvent {
  return {
    id: `imported-${e.id}`,
    title: e.title,
    date: e.date instanceof Date ? e.date : new Date(e.date),
    startHour: e.startHour,
    endHour: e.endHour,
    location: e.locationOverride ?? e.location ?? "",
    color: e.color,
    kind: "imported",
    source: e.source,
    calendarName: e.calendarName,
  };
}

// ── Live clock ────────────────────────────────────────────────────────────────

const useLiveClock = (isToday: boolean): number => {
  const [now, setNow] = useState(nowDecimal);
  useEffect(() => {
    if (!isToday) return;
    const id = window.setInterval(() => setNow(nowDecimal()), 30_000);
    return () => window.clearInterval(id);
  }, [isToday]);
  return now;
};

// ── Place open/closed status ──────────────────────────────────────────────────

function usePlaceStatus(location: string | undefined) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [openingHoursText, setOpeningHoursText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location?.trim()) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const p = await getPlaceDetails(location);
        if (!cancelled && p) {
          setIsOpen(p.isOpen);
          setOpeningHoursText(p.openingHoursText);
        }
      } catch {
        /* network error */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [location]);

  return { isOpen, openingHoursText, loading };
}

// ── LocationRow ───────────────────────────────────────────────────────────────

function LocationRow({
  event,
  onOpen,
}: {
  event: UnifiedEvent;
  onOpen?: (e: UnifiedEvent) => void;
}) {
  const syntheticEvent = useMemo<CalendarEvent>(
    () => ({
      id: event.id,
      title: event.title,
      date: event.date,
      startHour: event.startHour,
      endHour: event.endHour,
      location: event.location,
      color: event.color,
      kind: "event",
      attendees: [],
      description: "",
      videoconferencing: "",
    }),
    [event],
  );

  const { eta, loading: etaLoading } = useEventETA(syntheticEvent);
  const {
    isOpen,
    openingHoursText,
    loading: placeLoading,
  } = usePlaceStatus(event.location);

  if (!event.location?.trim()) return null;

  const modeIcons: Record<string, string> = {
    DRIVING: "🚗",
    WALKING: "🚶",
    TRANSIT: "🚌",
    BICYCLING: "🚴",
  };
  const activeMode = (() => {
    try {
      return localStorage.getItem("preferred_travel_mode") || "DRIVING";
    } catch {
      return "DRIVING";
    }
  })();

  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const urgent = eta
    ? (() => {
        const departH = event.startHour - eta.durationSeconds / 3600 - 5 / 60;
        return (
          Math.round((departH - nowH) * 60) <= 30 &&
          Math.round((departH - nowH) * 60) >= 0
        );
      })()
    : false;
  const modeIcon = urgent ? "🚨" : (modeIcons[activeMode] ?? "🚗");

  return (
    <div
      className={styles.locationRow}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(event);
      }}
    >
      {!placeLoading && isOpen !== null && (
        <div className={styles.locationRowTop}>
          <span className={isOpen ? styles.openBadge : styles.closedBadge}>
            {isOpen ? "● Open" : "● Closed"}
          </span>
          {openingHoursText && (
            <span className={styles.hoursText}>{openingHoursText}</span>
          )}
        </div>
      )}
      {etaLoading ? (
        <span className={styles.etaChip}>
          <span className={styles.etaSpinner} />
          <span className={styles.etaChipText}>ETA…</span>
        </span>
      ) : eta ? (
        <span
          className={`${styles.etaChip} ${urgent ? styles.etaChipUrgent : ""}`}
        >
          <span>{modeIcon}</span>
          <span className={styles.etaChipText}>{eta.durationText}</span>
          <span className={styles.etaChipDepart}> · {eta.distanceText}</span>
          <span className={styles.etaChipDepart}>
            {urgent ? (
              <strong className={styles.etaUrgentLabel}> · Leave soon!</strong>
            ) : (
              ` · ${eta.departByText}`
            )}
          </span>
        </span>
      ) : null}
    </div>
  );
}

// ── Source badge ──────────────────────────────────────────────────────────────

function SourceBadge({
  source,
  calendarName,
}: {
  source: "google" | "microsoft";
  calendarName?: string;
}) {
  return (
    <span
      className={`${styles.sourceBadge} ${
        source === "google"
          ? styles.sourceBadgeGoogle
          : styles.sourceBadgeMicrosoft
      }`}
    >
      {source === "google" ? "G" : "M"}
      {calendarName && (
        <span className={styles.sourceBadgeName}>{calendarName}</span>
      )}
    </span>
  );
}

// ── EventCard ─────────────────────────────────────────────────────────────────

function EventCard({
  event,
  status,
  now,
  onOpen,
  onViewLocation,
}: {
  event: UnifiedEvent;
  status: Status;
  now: number;
  onOpen: (e: UnifiedEvent) => void;
  onViewLocation?: (e: UnifiedEvent) => void;
}) {
  const isNow = status === "now";
  const isPast = status === "past";
  const isUpcoming = status === "upcoming";
  const isImported = event.kind === "imported";
  const duration = formatDuration(event.startHour, event.endHour);

  const cardRef = useRef<HTMLDivElement>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);

  const progress = isNow
    ? Math.min(
        100,
        Math.max(
          0,
          ((now - event.startHour) / (event.endHour - event.startHour)) * 100,
        ),
      )
    : 0;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      setRotY(((e.clientX - rect.left - rect.width / 2) / rect.width) * 15);
      setRotX(((e.clientY - rect.top - rect.height / 2) / rect.height) * -15);
    };
    const onLeave = () => {
      setRotX(0);
      setRotY(0);
    };
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const accentStyle = isImported ? { backgroundColor: event.color } : undefined;

  return (
    <div
      ref={cardRef}
      className={[
        styles.eventCard,
        isPast ? styles.eventCardPast : "",
        isNow ? styles.eventCardNow : "",
        isUpcoming ? styles.eventCardUpcoming : "",
        isImported ? styles.eventCardImported : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onOpen(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(event)}
      aria-label={`${event.title} ${fmt12(event.startHour)} to ${fmt12(event.endHour)}`}
      style={
        {
          transform: `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: "transform 0.1s ease-out",
        } as React.CSSProperties
      }
    >
      <div className={styles.cardMainRow}>
        <div
          className={[
            styles.eventAccent,
            isPast ? styles.accentPast : "",
            isNow ? styles.accentNow : "",
            isUpcoming ? styles.accentUpcoming : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={accentStyle}
        />

        <div className={styles.eventTime}>
          <span className={styles.eventTimeStart}>
            {fmt12(event.startHour)}
          </span>
          <span className={styles.eventTimeEnd}>{fmt12(event.endHour)}</span>
          <span className={styles.eventDuration}>{duration}</span>
        </div>

        <div className={styles.eventBody}>
          {/* Title on its own full-width row */}
          <div className={styles.eventTitle}>{event.title || "(No title)"}</div>
          {/* Source badge below the title, only for imported events */}
          {isImported && event.source && (
            <SourceBadge
              source={event.source}
              calendarName={event.calendarName}
            />
          )}
          {isNow && (
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {isUpcoming && (
            <div className={styles.upcomingEventInfo}>
              In {formatDuration(now, event.startHour)}
            </div>
          )}
          {event.location?.trim() && (
            <div className={styles.eventLocationLabel}><LocationIcon /> {event.location}</div>
          )}
        </div>

        {isPast && <span className={styles.badgeDone}>✓</span>}
        {isUpcoming && !event.location?.trim() && (
          <span className={styles.badgeUpcoming}>›</span>
        )}
      </div>

      {isUpcoming && event.location?.trim() && (
        <LocationRow event={event} onOpen={onViewLocation} />
      )}
    </div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  variant,
  count,
}: {
  label: string;
  variant: "now" | "upcoming" | "past";
  count: number;
}) {
  return (
    <div
      className={`${styles.sectionHeader} ${styles[`sectionHeader_${variant}`]}`}
    >
      <div
        className={`${styles.sectionDot} ${styles[`sectionDot_${variant}`]}`}
      />
      <span className={styles.sectionLabel}>{label}</span>
      <span
        className={`${styles.sectionCount} ${styles[`sectionCount_${variant}`]}`}
      >
        {count}
      </span>
    </div>
  );
}

// ── ConflictNotice — collapsible strip shown at top of event list ─────────────

function ConflictNotice({
  warnings,
  onDismiss,
  onSnooze,
  onEdit,
}: {
  warnings: ConflictWarning[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
  onEdit?: (e: UnifiedEvent) => void;
}) {
  const [expandedByUser, setExpandedByUser] = useState(false);
  const expanded = expandedByUser && warnings.length > 0;

  const overlapCount = warnings.filter((w) => w.kind === "overlap").length;
  const tightCount = warnings.filter((w) => w.kind === "tight").length;

  const summaryParts: string[] = [];
  if (overlapCount)
    summaryParts.push(`${overlapCount} overlap${overlapCount > 1 ? "s" : ""}`);
  if (tightCount) summaryParts.push(`${tightCount} tight`);
  const summary = summaryParts.join(" · ");

  const stripClass =
    overlapCount > 0 ? styles.conflictStripOverlap : styles.conflictStripTight;

  return (
    <div className={`${styles.conflictStrip} ${stripClass}`}>
      <button
        type="button"
        className={styles.conflictStripHeader}
        onClick={() => setExpandedByUser((v) => !v)}
        aria-expanded={expanded}
      >
        <span className={styles.conflictStripIcon}>⚠️</span>
        <span className={styles.conflictStripTitle}>
          {warnings.length} schedule conflict{warnings.length > 1 ? "s" : ""}
        </span>
        <span className={styles.conflictStripSummary}>{summary}</span>
        <span className={styles.conflictStripChevron}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className={styles.conflictStripDetail}>
          {warnings.map((w) => {
            const gapLabel =
              w.kind === "overlap"
                ? `Overlap ${Math.abs(w.gapMins)} min`
                : `${w.gapMins} min gap`;

            // Collect ALL editable (own-calendar) events in this conflict pair.
            // The original code only checked eventA, so if eventA was imported
            // and eventB was yours, the Edit button never appeared.
            const editableEvents: UnifiedEvent[] = [];
            if (w.eventA.kind !== "imported") editableEvents.push(w.eventA);
            if (w.eventB.kind !== "imported" && w.eventB.id !== w.eventA.id)
              editableEvents.push(w.eventB);

            return (
              <div key={w.id} className={styles.conflictStripRow}>
                <div className={styles.conflictStripRowLeft}>
                  <span className={styles.conflictStripRowTitle}>
                    {w.eventA.title === w.eventB.title
                      ? w.eventA.title
                      : `${w.eventA.title} → ${w.eventB.title}`}
                  </span>
                  <span className={styles.conflictStripRowMeta}>
                    {gapLabel}
                  </span>
                </div>
                <div className={styles.conflictStripRowActions}>
                  {onEdit &&
                    editableEvents.length > 0 &&
                    (editableEvents.length === 1 ||
                    w.eventA.title === w.eventB.title ? (
                      // Single edit button when titles match or only one is editable
                      <button
                        key={editableEvents[0].id}
                        type="button"
                        className={styles.conflictActionEdit}
                        onClick={() => onEdit(editableEvents[0])}
                        title={`Edit "${editableEvents[0].title}"`}
                      >
                        Edit
                      </button>
                    ) : (
                      // Two distinct titles — show labelled buttons
                      editableEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          className={styles.conflictActionEdit}
                          onClick={() => onEdit(ev)}
                          title={`Edit "${ev.title}"`}
                        >
                          Edit &ldquo;{ev.title}&rdquo;
                        </button>
                      ))
                    ))}
                  <button
                    type="button"
                    className={styles.conflictActionSnooze}
                    onClick={() => onSnooze(w.id)}
                    title="Snooze 1 hour"
                  >
                    Snooze
                  </button>
                  <button
                    type="button"
                    className={styles.conflictActionDismiss}
                    onClick={() => onDismiss(w.id)}
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── DailySummary ──────────────────────────────────────────────────────────────

interface Props {
  events: CalendarEvent[];
  importedEvents?: ImportedCalendarEvent[];
  onOpenEvent?: (e: CalendarEvent) => void;
  /** Called when the user clicks Edit from a conflict warning — should open the modal in EDIT mode. */
  onOpenEventForEdit?: (e: CalendarEvent) => void;
  onViewLocation?: (e: CalendarEvent) => void;
  onEventCompleted?: (eventId: string) => void;
  /** Mobile only — called when the ✕ close button is tapped */
  onClose?: () => void;
}

export function DailySummary({
  events,
  importedEvents = [],
  onOpenEvent,
  onOpenEventForEdit,
  onViewLocation,
  onEventCompleted,
  onClose,
}: Props) {
  const [viewDate, setViewDate] = useState<Date>(() => todayMidnight());

  const today = todayMidnight();
  const isToday = sameDay(viewDate, today);
  const isTomorrow = sameDay(viewDate, addDays(today, 1));
  const now = useLiveClock(isToday);

  const dayLabel = isToday
    ? "Today"
    : isTomorrow
      ? "Tomorrow"
      : headingFull(viewDate);

  // ── Stable unified list — only recomputed when the source arrays change ────

  const allUnified = useMemo<UnifiedEvent[]>(() => {
    const own = (events ?? []).map(toUnified);
    const imp = (importedEvents ?? []).map(importedToUnified);
    return [...own, ...imp].sort((a, b) => a.startHour - b.startHour);
  }, [events, importedEvents]);

  const dayEvents = useMemo(
    () => allUnified.filter((e) => sameDay(toMidnight(e.date), viewDate)),
    [allUnified, viewDate],
  );

  const grouped = useMemo(() => {
    const nowBucket: UnifiedEvent[] = [];
    const upcoming: UnifiedEvent[] = [];
    const past: UnifiedEvent[] = [];
    dayEvents.forEach((e) => {
      const s = getStatus(e, viewDate, now);
      if (s === "now") nowBucket.push(e);
      else if (s === "upcoming") upcoming.push(e);
      else past.push(e);
    });
    return { now: nowBucket, upcoming, past };
  }, [dayEvents, viewDate, now]);

  // ── Conflict detection — receives the stable dayEvents reference ───────────
  const { visibleWarnings, handleDismiss, handleSnooze } =
    useConflictDetection(dayEvents);

  const reportedCompletedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isToday || !onEventCompleted) return;
    grouped.past.forEach((e) => {
      if (!reportedCompletedRef.current.has(e.id)) {
        reportedCompletedRef.current.add(e.id);
        if (e.kind !== "imported") onEventCompleted(e.id);
      }
    });
  }, [grouped.past, isToday, onEventCompleted]);

  const handleOpen = useCallback(
    (u: UnifiedEvent) => {
      if (u.kind === "imported") return;
      const original = events.find((e) => String(e.id) === u.id);
      if (original) onOpenEvent?.(original);
    },
    [events, onOpenEvent],
  );

  // Works for both own AND imported events — imported gets a synthetic CalendarEvent
  const handleViewLocation = useCallback(
    (u: UnifiedEvent) => {
      if (u.kind === "imported") {
        const synthetic: CalendarEvent = {
          id: u.id,
          title: u.title,
          date: u.date,
          startHour: u.startHour,
          endHour: u.endHour,
          location: u.location,
          color: u.color,
          kind: "event",
          attendees: [],
          description: "",
          videoconferencing: "",
        };
        onViewLocation?.(synthetic);
        return;
      }
      const original = events.find((e) => String(e.id) === u.id);
      if (original) onViewLocation?.(original);
    },
    [events, onViewLocation],
  );

  // ── Edit from conflict notice — opens the event modal in edit mode ─────────
  // Converts UnifiedEvent back to CalendarEvent for onOpenEventForEdit callback
  const handleEditConflictEvent = useCallback(
    (u: UnifiedEvent) => {
      if (u.kind === "imported") return; // imported events are read-only
      const original = events.find((e) => String(e.id) === u.id);
      if (!original) return;
      if (onOpenEventForEdit) {
        onOpenEventForEdit(original);
      } else {
        onOpenEvent?.(original);
      }
    },
    [events, onOpenEventForEdit, onOpenEvent],
  );

  return (
    <div className={styles.wrapper}>
      {/* ── Day navigator ── */}
      <div className={styles.dayNav}>
        {onClose && (
          <button
            className={styles.dayNavCloseBtn}
            onClick={onClose}
            aria-label="Close agenda"
          >
            ✕
          </button>
        )}
        <button
          className={styles.navBtn}
          onClick={() => setViewDate((d) => addDays(d, -1))}
          aria-label="Previous day"
        >
          ‹
        </button>

        <div className={styles.dayNavCenter}>
          <div className={styles.dayNavLabel}>{dayLabel}</div>
          {(isToday || isTomorrow) && (
            <div className={styles.dayNavSub}>{headingFull(viewDate)}</div>
          )}
          <div className={styles.dayNavStats}>
            <span className={styles.eventCountBadge}>
              {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
            </span>
            {isToday && grouped.now.length > 0 && (
              <span className={styles.liveBadgeContainer}>
                <span className={styles.liveDot} />
                {grouped.now.length} Current
              </span>
            )}
          </div>
        </div>

        <button
          className={styles.navBtn}
          onClick={() => setViewDate((d) => addDays(d, 1))}
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      {/* ── Back to today ── */}
      {!isToday && (
        <button
          className={styles.backBtn}
          onClick={() => setViewDate(todayMidnight())}
        >
          ← Back to Today
        </button>
      )}

      {/* ── Conflict notice strip ── */}
      {visibleWarnings.length > 0 && (
        <ConflictNotice
          warnings={visibleWarnings}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          onEdit={handleEditConflictEvent}
        />
      )}

      {/* ── Event list ── */}
      <div className={styles.eventList}>
        {dayEvents.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyText}>No events scheduled</div>
            <div className={styles.emptyHint}>
              Drag on the calendar to create one
            </div>
          </div>
        ) : (
          <>
            {grouped.now.length > 0 && (
              <div className={styles.section}>
                <SectionHeader
                  label="Ongoing"
                  variant="now"
                  count={grouped.now.length}
                />
                {grouped.now.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    status="now"
                    now={now}
                    onOpen={handleOpen}
                    onViewLocation={handleViewLocation}
                  />
                ))}
              </div>
            )}

            {grouped.upcoming.length > 0 && (
              <>
                {grouped.now.length > 0 && (
                  <div className={styles.sectionDivider} />
                )}
                <div className={styles.section}>
                  <SectionHeader
                    label="Upcoming"
                    variant="upcoming"
                    count={grouped.upcoming.length}
                  />
                  {grouped.upcoming.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      status="upcoming"
                      now={now}
                      onOpen={handleOpen}
                      onViewLocation={handleViewLocation}
                    />
                  ))}
                </div>
              </>
            )}

            {grouped.past.length > 0 && (
              <>
                {(grouped.now.length > 0 || grouped.upcoming.length > 0) && (
                  <div className={styles.sectionDivider} />
                )}
                <div className={styles.section}>
                  <SectionHeader
                    label="Completed"
                    variant="past"
                    count={grouped.past.length}
                  />
                  {grouped.past.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      status="past"
                      now={now}
                      onOpen={handleOpen}
                      onViewLocation={handleViewLocation}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}