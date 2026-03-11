import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";
import styles from "./DailySummary.module.css";
import { useEventETA } from "../LocationPanel/UseEventETA";
import { getPlaceDetails } from "../LocationServices/LocationService";
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

// Returns current time as a decimal hour e.g. 14.5 = 2:30 PM
const nowDecimal = () => {
  const n = new Date();
  return n.getHours() + n.getMinutes() / 60 + n.getSeconds() / 3600;
};

type Status = "past" | "now" | "upcoming";

// Derives live status from current wall-clock time, not a snapshot
const getStatus = (e: CalendarEvent, viewDate: Date, now: number): Status => {
  const today = todayMidnight();
  if (viewDate < today) return "past";
  if (viewDate > today) return "upcoming";
  if (e.endHour <= now) return "past";
  if (e.startHour <= now) return "now";
  return "upcoming";
};

// Hook that ticks every 30 s while viewing today so statuses stay current
const useLiveClock = (isToday: boolean): number => {
  const [now, setNow] = useState(nowDecimal);

  useEffect(() => {
    if (!isToday) return;
    const id = globalThis.setInterval(() => setNow(nowDecimal()), 30_000);
    return () => globalThis.clearInterval(id);
  }, [isToday]);

  return now;
};
// Fetches open/closed status for a location
function usePlaceStatus(location: string | undefined): {
  isOpen: boolean | null;
  openingHoursText: string | null;
  loading: boolean;
} {
  const [isOpen,           setIsOpen]           = useState<boolean | null>(null);
  const [openingHoursText, setOpeningHoursText] = useState<string | null>(null);
  const [loading,          setLoading]          = useState(false);
  useEffect(() => {
    if (!location?.trim()) return;
    let cancelled = false;
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const p = await getPlaceDetails(location);
        if (!cancelled && p) {
          setIsOpen(p.isOpen);
          setOpeningHoursText(p.openingHoursText);
        }
      } catch { /* network error — badge simply won't show */ }
      finally { if (!cancelled) setLoading(false); }
    };
    void fetchStatus();
    return () => { cancelled = true; };
  }, [location]);
  return { isOpen, openingHoursText, loading };
}

// Full location row: open/closed badge + ETA chip on their own dedicated row
function LocationRow({ event, onOpen }: { event: CalendarEvent; onOpen?: (e: CalendarEvent) => void }) {
  const { eta, loading: etaLoading } = useEventETA(event);
  const { isOpen, openingHoursText, loading: placeLoading } = usePlaceStatus(event.location);

  if (!event.location?.trim()) return null;

  const modeIcons: Record<string, string> = {
    DRIVING: "🚗", WALKING: "🚶", TRANSIT: "🚌", BICYCLING: "🚴",
  };
  const activeMode = (() => {
    try { return localStorage.getItem("preferred_travel_mode") || "DRIVING"; } catch { return "DRIVING"; }
  })();

  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const urgent = eta
    ? (() => {
        const departH = event.startHour - eta.durationSeconds / 3600 - 5 / 60;
        return Math.round((departH - nowH) * 60) <= 30 && Math.round((departH - nowH) * 60) >= 0;
      })()
    : false;
  const modeIcon = urgent ? "🚨" : (modeIcons[activeMode] ?? "🚗");

  return (
    <div className={styles.locationRow} onClick={(e) => { e.stopPropagation(); onOpen?.(event); }}>
      {/* Top sub-row: open/closed badge + hours text */}
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

      {/* ETA chip row */}
      {etaLoading ? (
        <span className={styles.etaChip}>
          <span className={styles.etaSpinner} />
          <span className={styles.etaChipText}>ETA…</span>
        </span>
      ) : eta ? (
        <span
          className={styles.etaChip}
          style={urgent ? { borderColor: "rgba(240,96,58,0.4)", background: "rgba(240,96,58,0.10)", color: "#F0603A" } : {}}
        >
          <span>{modeIcon}</span>
          <span className={styles.etaChipText}>{eta.durationText}</span>
          <span className={styles.etaChipDepart}> · {eta.distanceText}</span>
          <span className={styles.etaChipDepart}>
            {urgent ? <strong style={{ color: "#F0603A" }}> · Leave soon!</strong> : ` · ${eta.departByText}`}
          </span>
        </span>
      ) : null}
    </div>
  );
}
function EventCard({
  event,
  status,
  now,
  onOpen,
  onViewLocation,
}: {
  event: CalendarEvent;
  status: Status;
  now: number;
  onOpen: (e: CalendarEvent) => void;
  onViewLocation?: (e: CalendarEvent) => void;
}) {
  const isNow = status === "now";
  const isPast = status === "past";
  const isUpcoming = status === "upcoming";
  const duration = formatDuration(event.startHour, event.endHour);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Progress derived from the live `now` prop so it updates when clock ticks
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
      const rotationY =
        ((e.clientX - rect.left - rect.width / 2) / rect.width) * 15;
      const rotationX =
        ((e.clientY - rect.top - rect.height / 2) / rect.height) * -15;
      setRotation({ x: rotationX, y: rotationY });
    };
    const onLeave = () => setRotation({ x: 0, y: 0 });
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={[
        styles.eventCard,
        isPast ? styles.eventCardPast : "",
        isNow ? styles.eventCardNow : "",
        isUpcoming ? styles.eventCardUpcoming : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onOpen(event)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(event)}
      aria-label={`${event.title} ${fmt12(event.startHour)} to ${fmt12(event.endHour)}`}
      style={{
        transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      {/* Main row: accent bar + time + body + badge */}
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
        />
        <div className={styles.eventTime}>
          <span className={styles.eventTimeStart}>{fmt12(event.startHour)}</span>
          <span className={styles.eventTimeEnd}>{fmt12(event.endHour)}</span>
          <span className={styles.eventDuration}>{duration}</span>
        </div>

        <div className={styles.eventBody}>
          <div className={styles.eventTitle}>{event.title || "(No title)"}</div>
          {isNow && (
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          )}
          {isUpcoming && (
            <div className={styles.upcomingEventInfo}>
              In {formatDuration(now, event.startHour)}
            </div>
          )}
          {event.location?.trim() && (
            <div className={styles.eventLocationLabel}>📍 {event.location}</div>
          )}
        </div>

        {isPast && <span className={styles.badgeDone}>✓</span>}
        {isUpcoming && !event.location?.trim() && <span className={styles.badgeUpcoming}>›</span>}
      </div>

      {/* Location row: open/closed + ETA — only for upcoming events with a location */}
      {isUpcoming && event.location?.trim() && (
        <LocationRow event={event} onOpen={onViewLocation} />
      )}
    </div>
  );
}

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

interface Props {
  events: CalendarEvent[];
  onOpenEvent?: (e: CalendarEvent) => void;
  onViewLocation?: (e: CalendarEvent) => void;
  // Called when an event transitions to "past" so the parent can persist it
  onEventCompleted?: (eventId: string) => void;
}

export function DailySummary({ events, onOpenEvent, onViewLocation, onEventCompleted }: Props) {
  const [viewDate, setViewDate] = useState<Date>(() => todayMidnight());

  const today = todayMidnight();
  const isToday = sameDay(viewDate, today);
  const isTomorrow = sameDay(viewDate, addDays(today, 1));

  // Live clock — only ticks when viewing today
  const now = useLiveClock(isToday);

  const dayLabel = isToday
    ? "Today"
    : isTomorrow
      ? "Tomorrow"
      : headingFull(viewDate);

  const dayEvents = useMemo(
    () =>
      (events ?? [])
        .filter((e) => sameDay(toMidnight(e.date), viewDate))
        .sort((a, b) => a.startHour - b.startHour),
    [events, viewDate],
  );

  // Grouped is recomputed whenever `now` ticks, catching mid-tick transitions
  const grouped = useMemo(() => {
    const nowBucket: CalendarEvent[] = [];
    const upcoming: CalendarEvent[] = [];
    const past: CalendarEvent[] = [];
    dayEvents.forEach((e) => {
      const s = getStatus(e, viewDate, now);
      if (s === "now") nowBucket.push(e);
      else if (s === "upcoming") upcoming.push(e);
      else past.push(e);
    });
    return { now: nowBucket, upcoming, past };
  }, [dayEvents, viewDate, now]);

  // Track which events have been reported as completed to avoid duplicate calls
  const reportedCompletedRef = useRef<Set<string>>(new Set());

  // Fire onEventCompleted exactly once per event when it first moves to "past"
  useEffect(() => {
    if (!isToday || !onEventCompleted) return;
    grouped.past.forEach((e) => {
      if (!reportedCompletedRef.current.has(e.id)) {
        reportedCompletedRef.current.add(e.id);
        onEventCompleted(e.id);
      }
    });
  }, [grouped.past, isToday, onEventCompleted]);

  const handleOpen = useCallback(
    (e: CalendarEvent) => onOpenEvent?.(e),
    [onOpenEvent],
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.dayNav}>
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
                {grouped.now.length} live
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

      {!isToday && (
        <button
          className={styles.backBtn}
          onClick={() => setViewDate(todayMidnight())}
        >
          ← Back to Today
        </button>
      )}

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
                  label="Happening Now"
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
                    onViewLocation={onViewLocation}
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
                      onViewLocation={onViewLocation}
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
                      onViewLocation={onViewLocation}
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