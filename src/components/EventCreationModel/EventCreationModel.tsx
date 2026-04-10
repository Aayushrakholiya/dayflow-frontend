/*  
*  FILE          : EventCreationModel.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Modal form for creating and editing calendar events with location autocomplete and date picker.
*/ 

import { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import styles from "./EventCreationModel.module.css";
import deleteIcon from "../../assets/icon_delete.png";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  getAutocompleteSuggestions,
  type AutocompleteResult,
} from "../LocationServices/LocationService";
import { sendEventInvites } from "../../api";

// ─── Public types ───
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startHour: number;
  endHour: number;
  attendees: string[];
  location: string;
  locationCoords?: { lat: number; lng: number };
  description: string;
  videoconferencing: string;
  color: string;

  kind?: "event" | "task";
  dueDate?: Date;
  durationMinutes?: number;
}

interface EventCreationModalProps {
  date: Date;
  startHour: number;
  endHour: number;
  position?: { top: number; left: number } | null;
  onClose: () => void;
  onCreate: (event: CalendarEvent) => void;

  mode?: "create" | "view" | "edit";
  event?: CalendarEvent | null;
  onUpdate?: (updatedEvent: CalendarEvent) => void;
  onDelete?: (id: string) => void;
  onViewLocation?: (e: CalendarEvent) => void;
  userCoords?: { lat: number; lng: number } | null;
}

// ─── Helpers ───
const formatHour12 = (h: number): string => {
  const totalMinutes = Math.round(h * 60);
  const h24 = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  const period = h24 < 12 ? "AM" : "PM";
  return `${hour}:${pad2(mins)} ${period}`;
};

const shortMonth = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short" });

const shortDay = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short" });

// ===== date input helpers =====
const pad2 = (n: number) => String(n).padStart(2, "0");
const toDateInputValue = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// ===== Task helpers =====
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const minutesToHourDecimal = (mins: number) => mins / 60;
const hourDecimalToMinutes = (h: number) => Math.round(h * 60);

const minutesToTimeValue = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
};

const timeValueToMinutes = (value: string) => {
  const [hh, mm] = value.split(":").map((x) => Number(x));
  const h = Number.isFinite(hh) ? hh : 0;
  const m = Number.isFinite(mm) ? mm : 0;
  return clamp(h * 60 + m, 0, 23 * 60 + 59);
};

const formatDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} hrs ${m} mins`;
  if (h > 0) return `${h} hrs`;
  return `${m} mins`;
};

function MiniDatePicker({
  value,
  onChange,
  className,
}: {
  value: Date;
  onChange: (d: Date) => void;
  className?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`${className ?? ""} ${styles.miniDatePickerTrigger}`}
        >
          {value.toLocaleDateString("en-CA")}
          <span aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" color="#000000" fill="none" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C13.3313 22 13.8509 22 14.3769 21.9992C15.1689 21.998 15.5649 21.9974 15.9316 21.8452C16.2983 21.693 16.5815 21.4099 17.1477 20.8436L19.8436 18.1477C20.4099 17.5815 20.693 17.2983 20.8452 16.9316C20.9974 16.5649 20.998 16.1689 20.9992 15.3769C21 14.8509 21 14.3313 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" />
    <path d="M15 22C15.0359 19.5168 15.2201 18.109 16.1646 17.1646C17.109 16.2201 18.5168 16.0359 21 16" />
    <path d="M16 2V6M8 2V6" />
    <path d="M3 10H21" />
</svg></span>
        </button>
      </Popover.Trigger>

      <Popover.Portal
        container={typeof document !== "undefined" ? document.body : undefined}
      >
        <Popover.Content
          sideOffset={10}
          align="end"
          avoidCollisions
          collisionPadding={12}
          className={styles.miniDatePickerContent}
        >
          <div className={styles.miniDatePickerTopBar}>
            <button
              type="button"
              className={styles.miniDatePickerTodayBtn}
              onClick={() => onChange(new Date())}
            >
              Today
            </button>

            <Popover.Close asChild>
              <button type="button" className={styles.miniDatePickerCloseBtn}>
                ✕
              </button>
            </Popover.Close>
          </div>

          <div className={styles.miniDatePickerDayWrap}>
            <DayPicker
              mode="single"
              selected={value}
              onSelect={(d) => d && onChange(d)}
              showOutsideDays
              weekStartsOn={1}
              captionLayout="dropdown"
              fromYear={2000}
              toYear={2035}
              styles={{
                root: {
                  width: "100%",
                  margin: 0,
                  padding: 0,
                  "--rdp-cell-size": "28px",
                } as React.CSSProperties,

                months: { width: "100%", margin: 0, padding: 0 },
                month: { width: "100%", margin: 0, padding: 0 },

                table: {
                  width: "100%",
                  margin: 0,
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                },

                cell: {
                  padding: 0,
                  textAlign: "center",
                },

                caption_label: {
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#1f2937",
                },

                head_cell: {
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#6b7280",
                },

                day: {
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: "12px",
                },

                day_selected: {
                  backgroundColor: "rgba(255,106,61,0.16)",
                  outline: "2px solid #ff6a3d",
                  outlineOffset: "-2px",
                  color: "#111827",
                },

                day_today: {
                  outline: "2px solid rgba(255,106,61,0.45)",
                  outlineOffset: "-2px",
                },

                dropdown: {
                  border: "1px solid rgba(0,0,0,0.10)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                },
              }}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function LocationAutocompleteInput({
  value,
  onChange,
  onCoordsResolved,
  disabled,
  className,
  userCoords,
}: {
  value: string;
  onChange: (v: string) => void;
  onCoordsResolved?: (coords: { lat: number; lng: number } | null) => void;
  disabled?: boolean;
  className?: string;
  userCoords?: { lat: number; lng: number } | null;
}) {
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateRect = useCallback(() => {
    if (inputRef.current)
      setDropdownRect(inputRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open, updateRect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    onCoordsResolved?.(null);
    setActiveIdx(-1);
    if (!v.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const raw = await getAutocompleteSuggestions(
          v,
          userCoords ?? undefined,
          "CA",
        );
        const results = raw.filter(
          (s) =>
            /\bcanada\b/i.test(s.secondaryText ?? "") ||
            /\bcanada\b/i.test(s.description ?? "") ||
            /,\s*(ON|QC|BC|AB|MB|SK|NS|NB|NL|PE|NT|NU|YT)\b/.test(
              `${s.secondaryText ?? ""} ${s.description ?? ""}`,
            ),
        );
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        /* network error */
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelect = (s: AutocompleteResult) => {
    setOpen(false);
    setSuggestions([]);
    setActiveIdx(-1);
    const label = s.secondaryText
      ? `${s.mainText}, ${s.secondaryText}`
      : s.mainText || s.description;
    onChange(label);
    onCoordsResolved?.(s.coords ?? null);
  };

  const dropdown =
    open && suggestions.length > 0 && dropdownRect
      ? ReactDOM.createPortal(
          <div
            role="listbox"
            style={{
              position: "fixed",
              top: dropdownRect.bottom + 4,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 99999,
              background: "#ffffff",
              border: "1.5px solid #e8e8e8",
              borderRadius: 12,
              boxShadow:
                "0 12px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={s.placeId}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`${styles.locationDropdownItem} ${i === activeIdx ? styles.locationDropdownItemActive : ""}`}
              >
                <span className={styles.locationDropdownPin}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" /><path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" /><path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" /></svg></span>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.locationDropdownMain}>
                    {s.mainText}
                  </div>
                  {s.secondaryText && (
                    <div className={styles.locationDropdownSub}>
                      {s.secondaryText}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={styles.locationInputWrap}>
      <input
        ref={inputRef}
        type="text"
        className={className}
        placeholder="Search location…"
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIdx]);
          } else if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
            updateRect();
          }
        }}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        role="combobox"
      />
      {loading && <span className={styles.locationSpinner} />}
      {dropdown}
    </div>
  );
}
// ─── Component ───
export default function EventCreationModel({
  date,
  startHour,
  endHour,
  position,
  onClose,
  onCreate,

  mode = "create",
  event = null,
  onUpdate,
  onDelete,
  onViewLocation,
  userCoords,
}: EventCreationModalProps) {
  const baseDate = event?.date ? new Date(event.date) : new Date(date);
  const baseStartHour =
    typeof event?.startHour === "number" ? event.startHour : startHour;
  const baseEndHour =
    typeof event?.endHour === "number" ? event.endHour : endHour;

  const isCreateMode = mode === "create";
  const isTaskEvent = event?.kind === "task";

  // active tab defaults based on what user opened
  const [activeTab, setActiveTab] = useState<"Event" | "Task">(() =>
    isTaskEvent ? "Task" : "Event",
  );

  // ===== Event form state =====
  const [title, setTitle] = useState(() => event?.title ?? "");
  const [attendeeInput, setAttendeeInput] = useState("");
  const [attendees, setAttendees] = useState<string[]>(() =>
    Array.isArray(event?.attendees) ? event!.attendees : [],
  );
  const [location, setLocation] = useState(() => event?.location ?? "");
  const [locationCoords, setLocationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() => event?.locationCoords ?? null);
  const [description, setDescription] = useState(
    () => event?.description ?? "",
  );
  const [videoconferencing, setVideoconferencing] = useState(
    () => event?.videoconferencing ?? "",
  );

  const [showAttendees, setShowAttendees] = useState(
    () => (event?.attendees?.length ?? 0) > 0,
  );
  const [showVideo, setShowVideo] = useState(() => !!event?.videoconferencing);
  const [showLocation, setShowLocation] = useState(() => !!event?.location);
  const [showDescription, setShowDescription] = useState(
    () => !!event?.description,
  );

  // ===== create-mode date/time state (lets user pick a different date) =====
  const [createDate, setCreateDate] = useState<Date>(() => new Date(baseDate));
  const [createStartHour, setCreateStartHour] = useState<number>(() => baseStartHour);
  const [createEndHour, setCreateEndHour] = useState<number>(() => baseEndHour);

  // ===== edit state =====
  const [isEditing, setIsEditing] = useState(() => mode === "edit");
  const [editDate, setEditDate] = useState<Date>(() => new Date(baseDate));
  const [editStartHour, setEditStartHour] = useState<number>(
    () => baseStartHour,
  );
  const [editEndHour, setEditEndHour] = useState<number>(() => baseEndHour);

  // ===== Task state (create + view/edit) =====
  const initialStartMinutes = clamp(
    hourDecimalToMinutes(baseStartHour),
    0,
    23 * 60 + 45,
  );
  const initialDurationMinutes = clamp(
    Math.max(
      15,
      hourDecimalToMinutes(baseEndHour) - hourDecimalToMinutes(baseStartHour),
    ),
    15,
    24 * 60,
  );

  const [taskTitle, setTaskTitle] = useState(() =>
    isTaskEvent ? (event?.title ?? "") : "",
  );
  const [taskDurationMinutes, setTaskDurationMinutes] = useState(
    () => event?.durationMinutes ?? initialDurationMinutes,
  );
  const [taskStartMinutes, setTaskStartMinutes] = useState(
    () => initialStartMinutes,
  );
  const [taskDueDate, setTaskDueDate] = useState<Date>(() =>
    event?.dueDate ? new Date(event.dueDate) : new Date(baseDate),
  );

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAddAttendee = (raw = attendeeInput) => {
    const emails = raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (emails.length === 0) return;
    setAttendees((prev) => {
      const next = [...prev];
      for (const email of emails) {
        if (!next.includes(email)) next.push(email);
      }
      return next;
    });
    setAttendeeInput("");
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendees((prev) => prev.filter((a) => a !== email));
  };

  // ===== Create Event =====
  const handleCreate = () => {
    // Flush any unsaved comma-separated input before creating
    const pendingEmails = attendeeInput
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const finalAttendees = [
      ...attendees,
      ...pendingEmails.filter((e) => !attendees.includes(e)),
    ];

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: title || "(No title)",
      date: new Date(createDate.getFullYear(), createDate.getMonth(), createDate.getDate()),
      startHour: createStartHour,
      endHour: createEndHour,
      attendees: finalAttendees,
      location,
      locationCoords: locationCoords ?? undefined,
      description,
      videoconferencing,
      color: "#BFDBFE",
      kind: "event",
    };
    onCreate(newEvent);

    // Fire invite emails — non-blocking
    if (finalAttendees.length > 0) {
      sendEventInvites({
        eventTitle: newEvent.title,
        date: newEvent.date.toISOString(),
        startHour: newEvent.startHour,
        endHour: newEvent.endHour,
        attendees: finalAttendees,
        location: location || undefined,
        videoconferencing: videoconferencing || undefined,
        description: description || undefined,
      });
    }
  };

  // ===== Create Task =====
  const handleCreateTask = () => {
    const due = new Date(
      taskDueDate.getFullYear(),
      taskDueDate.getMonth(),
      taskDueDate.getDate(),
    );
    const startDec = minutesToHourDecimal(taskStartMinutes);
    const endDec = minutesToHourDecimal(taskStartMinutes + taskDurationMinutes);

    const newTask: CalendarEvent = {
      id: crypto.randomUUID(),
      title: taskTitle || "(No title)",
      date: due,
      startHour: startDec,
      endHour: endDec,
      attendees: [],
      location: "",
      description: "",
      videoconferencing: "",
      color: "#FFD1A9 ",
      kind: "task",
      dueDate: due,
      durationMinutes: taskDurationMinutes,
    };

    onCreate(newTask);
  };

  // ===== View/Edit shared =====
  const handleBeginEdit = () => setIsEditing(true);

  // ===== Update event OR task =====
  const handleUpdate = () => {
    if (!event) return;

    if (event.kind === "task") {
      const due = new Date(
        taskDueDate.getFullYear(),
        taskDueDate.getMonth(),
        taskDueDate.getDate(),
      );
      const startDec = minutesToHourDecimal(taskStartMinutes);
      const endDec = minutesToHourDecimal(
        taskStartMinutes + taskDurationMinutes,
      );

      const updatedTask: CalendarEvent = {
        ...event,
        kind: "task",
        title: taskTitle || "(No title)",
        date: due,
        dueDate: due,
        durationMinutes: taskDurationMinutes,
        startHour: startDec,
        endHour: endDec,
        color: event.color,
      };

      onUpdate?.(updatedTask);
      onClose();
      return;
    }

    // Flush any unsaved comma-separated input before updating
    const pendingEmails = attendeeInput
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    const finalAttendees = [
      ...attendees,
      ...pendingEmails.filter((e) => !attendees.includes(e)),
    ];

    const updatedEvent: CalendarEvent = {
      ...event,
      kind: "event",
      title: title || "(No title)",
      date: new Date(
        editDate.getFullYear(),
        editDate.getMonth(),
        editDate.getDate(),
      ),
      startHour: editStartHour,
      endHour: editEndHour,
      attendees: finalAttendees,
      location,
      locationCoords: locationCoords ?? undefined,
      description,
      videoconferencing,
      color: event.color,
    };

    onUpdate?.(updatedEvent);

    // Re-send invites — non-blocking
    if (finalAttendees.length > 0) {
      sendEventInvites({
        eventTitle: updatedEvent.title,
        date: updatedEvent.date.toISOString(),
        startHour: updatedEvent.startHour,
        endHour: updatedEvent.endHour,
        attendees: finalAttendees,
        location: location || undefined,
        videoconferencing: videoconferencing || undefined,
        description: description || undefined,
      });
    }

    onClose();
  };

  const dateLabel = `${shortMonth(baseDate)} ${baseDate.getDate()}`;
  const dayLabel = `${shortDay(baseDate)} ${baseDate.getDate()}`;
  const timeRange = `${formatHour12(baseStartHour)} - ${formatHour12(baseEndHour)} EST`;

  // Task constraints
  const durationMax = 24 * 60;
  const safeStart = clamp(taskStartMinutes, 0, 24 * 60 - 15);
  const safeDuration = clamp(taskDurationMinutes, 15, durationMax);
  const endOk = safeStart + safeDuration <= 24 * 60;

  const isTaskTab = activeTab === "Task";
  const isEventTab = activeTab === "Event";

  const isViewingExisting = !isCreateMode && !!event;
  const isViewMode = isViewingExisting && !isEditing;

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={isCreateMode ? "Create" : "Details"}
    >
      <div
        className={styles.modal}
        style={
          position && window.innerWidth > 768
            ? { position: "fixed", top: position.top, left: position.left }
            : undefined
        }
      >
        <div className={styles.formPane}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.tabs}>
              {(["Event", "Task"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tab} ${
                    activeTab === tab ? styles.tabActive : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <span className={styles.dateBadge}>{dayLabel}</span>

            <div className={styles.headerActions}>
              {!isCreateMode && event && onDelete && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => {
                    onDelete(event.id);
                    onClose();
                  }}
                  aria-label="Delete"
                  title="Delete"
                >
                  <img
                    src={deleteIcon}
                    alt="Delete"
                    className={styles.deleteIcon}
                  />
                </button>
              )}
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ========================= EVENT TAB ========================= */}
          {isEventTab && (
            <>
              <div className={styles.formRow}>
                <span className={styles.icon}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" color="#000000" fill="none" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"><path d="M16.4249 4.60509L17.4149 3.6151C18.2351 2.79497 19.5648 2.79497 20.3849 3.6151C21.205 4.43524 21.205 5.76493 20.3849 6.58507L19.3949 7.57506M16.4249 4.60509L9.76558 11.2644C9.25807 11.772 8.89804 12.4078 8.72397 13.1041L8 16L10.8959 15.276C11.5922 15.102 12.228 14.7419 12.7356 14.2344L19.3949 7.57506M16.4249 4.60509L19.3949 7.57506" /><path d="M18.9999 13.5C18.9999 16.7875 18.9999 18.4312 18.092 19.5376C17.9258 19.7401 17.7401 19.9258 17.5375 20.092C16.4312 21 14.7874 21 11.4999 21H11C7.22876 21 5.34316 21 4.17159 19.8284C3.00003 18.6569 3 16.7712 3 13V12.5C3 9.21252 3 7.56879 3.90794 6.46244C4.07417 6.2599 4.2599 6.07417 4.46244 5.90794C5.56879 5 7.21252 5 10.5 5" /></svg></span>
                <input
                  ref={titleRef}
                  type="text"
                  className={styles.titleInput}
                  placeholder="Event title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isViewingExisting && isViewMode}
                />
              </div>

              <div className={styles.formRow}>
                <span className={styles.icon}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" color="#000000" fill="none" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C13.3313 22 13.8509 22 14.3769 21.9992C15.1689 21.998 15.5649 21.9974 15.9316 21.8452C16.2983 21.693 16.5815 21.4099 17.1477 20.8436L19.8436 18.1477C20.4099 17.5815 20.693 17.2983 20.8452 16.9316C20.9974 16.5649 20.998 16.1689 20.9992 15.3769C21 14.8509 21 14.3313 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" />
    <path d="M15 22C15.0359 19.5168 15.2201 18.109 16.1646 17.1646C17.109 16.2201 18.5168 16.0359 21 16" />
    <path d="M16 2V6M8 2V6" />
    <path d="M3 10H21" />
</svg></span>

                {isViewMode ? (
                  // View mode — static display
                  <span className={styles.dateTimeText}>
                    {dateLabel}&nbsp;&nbsp;{timeRange}
                  </span>
                ) : (
                  // Create mode AND edit mode — full date + time picker
                  <div className={styles.editWrap}>
                    <MiniDatePicker
                      value={isCreateMode ? createDate : editDate}
                      onChange={isCreateMode ? setCreateDate : setEditDate}
                      className={styles.dateInput}
                    />
                    <div className={styles.timeRow}>
                      <select
                        className={styles.timeSelect}
                        value={isCreateMode ? createStartHour : editStartHour}
                        onChange={(e) =>
                          isCreateMode
                            ? setCreateStartHour(Number(e.target.value))
                            : setEditStartHour(Number(e.target.value))
                        }
                      >
                        {Array.from({ length: 96 }, (_, i) => {
                          const h = i * 0.25;
                          return (
                            <option key={h} value={h}>
                              {formatHour12(h)}
                            </option>
                          );
                        })}
                      </select>

                      <span className={styles.timeDash}>–</span>

                      <select
                        className={styles.timeSelect}
                        value={isCreateMode ? createEndHour : editEndHour}
                        onChange={(e) =>
                          isCreateMode
                            ? setCreateEndHour(Number(e.target.value))
                            : setEditEndHour(Number(e.target.value))
                        }
                      >
                        {Array.from({ length: 96 }, (_, i) => {
                          const h = i * 0.25;
                          return (
                            <option key={h} value={h}>
                              {formatHour12(h)}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Duration badge + quick-set buttons */}
                    {(() => {
                      const s = isCreateMode ? createStartHour : editStartHour;
                      const e = isCreateMode ? createEndHour : editEndHour;
                      const setEnd = isCreateMode ? setCreateEndHour : setEditEndHour;
                      return e > s ? (
                        <div className={styles.durationRow}>
                          <span className={styles.durationBadge}>
                            {formatDuration(Math.round((e - s) * 60))}
                          </span>
                          {[15, 30, 60, 90].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              className={`${styles.durationQuickBtn} ${Math.round((e - s) * 60) === mins ? styles.durationQuickBtnActive : ""}`}
                              onClick={() => setEnd(s + mins / 60)}
                            >
                              {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.warn}>
                          End time should be after start time
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className={styles.formRow}>
                <span className={styles.icon} style={{ paddingBottom: '6px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 11C15.5 9.067 13.933 7.5 12 7.5C10.067 7.5 8.5 9.067 8.5 11C8.5 12.933 10.067 14.5 12 14.5C13.933 14.5 15.5 12.933 15.5 11Z" />
    <path d="M15.4827 11.3499C15.8047 11.4475 16.1462 11.5 16.5 11.5C18.433 11.5 20 9.933 20 8C20 6.067 18.433 4.5 16.5 4.5C14.6851 4.5 13.1928 5.8814 13.0173 7.65013" />
    <path d="M10.9827 7.65013C10.8072 5.8814 9.31492 4.5 7.5 4.5C5.567 4.5 4 6.067 4 8C4 9.933 5.567 11.5 7.5 11.5C7.85381 11.5 8.19535 11.4475 8.51727 11.3499" />
    <path d="M22 16.5C22 13.7386 19.5376 11.5 16.5 11.5" />
    <path d="M17.5 19.5C17.5 16.7386 15.0376 14.5 12 14.5C8.96243 14.5 6.5 16.7386 6.5 19.5" />
    <path d="M7.5 11.5C4.46243 11.5 2 13.7386 2 16.5" />
</svg></span>
                <div style={{ flex: 1 }}>
                  {!showAttendees ? (
                    <span
                      className={styles.fieldLabelClickable}
                      onClick={() => setShowAttendees(true)}
                    >
                      Attendees
                    </span>
                  ) : (
                    <>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {attendees.map((a) => (
                          <span key={a} className={styles.attendeeChip}>
                            {a}
                            <button
                              type="button"
                              className={styles.removeChip}
                              onClick={() => handleRemoveAttendee(a)}
                              aria-label={`Remove ${a}`}
                              disabled={isViewingExisting && isViewMode}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      <input
                        type="text"
                        className={styles.fieldInput}
                        placeholder="email@example.com, another@example.com"
                        value={attendeeInput}
                        onChange={(e) => setAttendeeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            handleAddAttendee();
                          }
                        }}
                        onBlur={() => {
                          if (attendeeInput.trim()) {
                            handleAddAttendee();
                          } else if (attendees.length === 0) {
                            setShowAttendees(false);
                          }
                        }}
                        style={{ marginTop: attendees.length > 0 ? 6 : 0 }}
                        disabled={isViewingExisting && isViewMode}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <span className={styles.icon} style={{ paddingBottom: '6px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10V8C2 7.05719 2 6.58579 2.29289 6.29289C2.58579 6 3.05719 6 4 6H7C10.7712 6 12.6569 6 13.8284 7.17157C15 8.34315 15 10.2288 15 14V16C15 16.9428 15 17.4142 14.7071 17.7071C14.4142 18 13.9428 18 13 18H10C6.22876 18 4.34315 18 3.17157 16.8284C2 15.6569 2 13.7712 2 10Z" />
    <path d="M17.8995 9.07049L18.5997 8.39526C20.0495 6.99707 20.7744 6.29798 21.3872 6.55106C22 6.80414 22 7.80262 22 9.79956V14.2004C22 16.1974 22 17.1959 21.3872 17.4489C20.7744 17.702 20.0495 17.0029 18.5997 15.6047L17.8995 14.9295C17.0122 14.0738 17 14.0453 17 12.8231V11.1769C17 9.95473 17.0122 9.92624 17.8995 9.07049Z" />
</svg></span>
                {!showVideo ? (
                  <span
                    className={styles.fieldLabelClickable}
                    onClick={() => setShowVideo(true)}
                  >
                    Videoconferencing
                  </span>
                ) : (
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Videoconferencing"
                    value={videoconferencing}
                    onChange={(e) => setVideoconferencing(e.target.value)}
                    onBlur={() => {
                      if (videoconferencing.trim() === "") setShowVideo(false);
                    }}
                    disabled={isViewingExisting && isViewMode}
                  />
                )}
              </div>

              <div className={styles.formRow}>
                <span className={styles.icon} style={{ paddingBottom: '6px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" /><path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" /><path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" /></svg></span>
                {!showLocation ? (
                  <span
                    className={styles.fieldLabelClickable}
                    onClick={() => setShowLocation(true)}
                  >
                    Location
                  </span>
                ) : (
                  <LocationAutocompleteInput
                    value={location}
                    onChange={setLocation}
                    onCoordsResolved={setLocationCoords}
                    userCoords={userCoords}
                    disabled={isViewingExisting && isViewMode}
                    className={styles.fieldInput}
                  />
                )}
              </div>

              <div className={styles.formRow}>
                <span className={styles.icon} style={{ paddingBottom: '6px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5L14 5" />
    <path d="M4 12L20 12" />
    <path d="M4 19L20 19" />
</svg></span>
                {!showDescription ? (
                  <span
                    className={styles.fieldLabelClickable}
                    onClick={() => setShowDescription(true)}
                  >
                    Description
                  </span>
                ) : (
                  <textarea
                    className={styles.descriptionArea}
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => {
                      if (description.trim() === "") setShowDescription(false);
                    }}
                    disabled={isViewingExisting && isViewMode}
                  />
                )}
              </div>

              {/* Footer buttons */}
              {isCreateMode ? (
                <button
                  type="button"
                  className={styles.createButton}
                  onClick={handleCreate}
                  disabled={createEndHour <= createStartHour}
                  aria-disabled={createEndHour <= createStartHour}
                >
                  Create event
                </button>
              ) : (
                <div className={styles.footerRow}>
                  {isViewMode ? (
                    <button
                      type="button"
                      className={styles.createButton}
                      onClick={handleBeginEdit}
                    >
                      Edit event
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.createButton}
                      onClick={handleUpdate}
                      disabled={editEndHour <= editStartHour}
                      aria-disabled={editEndHour <= editStartHour}
                    >
                      Update event
                    </button>
                  )}
                  {event?.location && (
                    <button
                      type="button"
                      className={styles.createButton}
                      onClick={() => onViewLocation?.(event)}
                      style={{
                        background: "rgba(59,120,245,0.08)",
                        color: "#3B78F5",
                        border: "1.5px solid rgba(59,120,245,0.25)",
                        marginTop: 8,
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: "inline", marginRight: "6px", verticalAlign: "middle"}}><path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" /><path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" /><path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" /></svg> View Location & ETA
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ========================= TASK TAB ========================= */}
          {isTaskTab && (
            <>
              {/* Task title */}
              <div className={styles.formRow}>
                <span className={styles.icon}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" color="#000000" fill="none" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round"><path d="M16.4249 4.60509L17.4149 3.6151C18.2351 2.79497 19.5648 2.79497 20.3849 3.6151C21.205 4.43524 21.205 5.76493 20.3849 6.58507L19.3949 7.57506M16.4249 4.60509L9.76558 11.2644C9.25807 11.772 8.89804 12.4078 8.72397 13.1041L8 16L10.8959 15.276C11.5922 15.102 12.228 14.7419 12.7356 14.2344L19.3949 7.57506M16.4249 4.60509L19.3949 7.57506" /><path d="M18.9999 13.5C18.9999 16.7875 18.9999 18.4312 18.092 19.5376C17.9258 19.7401 17.7401 19.9258 17.5375 20.092C16.4312 21 14.7874 21 11.4999 21H11C7.22876 21 5.34316 21 4.17159 19.8284C3.00003 18.6569 3 16.7712 3 13V12.5C3 9.21252 3 7.56879 3.90794 6.46244C4.07417 6.2599 4.2599 6.07417 4.46244 5.90794C5.56879 5 7.21252 5 10.5 5" /></svg></span>
                <input
                  type="text"
                  className={styles.titleInput}
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  disabled={isViewingExisting && isViewMode}
                />
              </div>

              {/* Duration */}
              {/* Duration */}
              <div className={styles.formRow}>
                <span className={styles.icon} style={{ paddingBottom: '6px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 3H20" />
    <path d="M5.5 3V5.03039C5.5 6.27227 6.07682 7.4437 7.06116 8.20089L12 12L16.9388 8.20089C17.9232 7.44371 18.5 6.27227 18.5 5.03039V3" />
    <path d="M5.5 21V18.9696C5.5 17.7277 6.07682 16.5563 7.06116 15.7991L12 12L16.9388 15.7991C17.9232 16.5563 18.5 17.7277 18.5 18.9696V21" />
    <path d="M4 21H20" />
</svg></span>

                <div className={styles.taskDurationBox}>
                  <div>
                    <div className={styles.taskLabel}>Duration</div>
                    <div className={styles.taskDuration}>
                      {formatDuration(safeDuration)}
                    </div>
                  </div>

                  <div className={styles.taskStepButtons}>
                    <button
                      type="button"
                      className={styles.taskStepBtn}
                      onClick={() =>
                        setTaskDurationMinutes((m) =>
                          clamp(m - 15, 15, durationMax),
                        )
                      }
                      disabled={isViewingExisting && isViewMode}
                    >
                      –
                    </button>
                    <button
                      type="button"
                      className={styles.taskStepBtn}
                      onClick={() =>
                        setTaskDurationMinutes((m) =>
                          clamp(m + 15, 15, durationMax),
                        )
                      }
                      disabled={isViewingExisting && isViewMode}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Start time + Due date */}
              <div className={styles.formRow}>
                <span className={styles.icon} style={{ marginTop: '12px' }}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none" stroke="#141B34" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8V12L14 14" />
</svg></span>
                <div className={styles.row2col}>
                  <div>
                    <div
                      className={styles.taskLabel}
                      style={{ marginBottom: 6 }}
                    >
                      Start time
                    </div>
                    <input
                      type="time"
                      step={900}
                      className={styles.inputBox}
                      value={minutesToTimeValue(safeStart)}
                      onChange={(e) =>
                        setTaskStartMinutes(timeValueToMinutes(e.target.value))
                      }
                      disabled={isViewingExisting && isViewMode}
                    />
                  </div>

                  <div>
                    <div
                      className={styles.taskLabel}
                      style={{ marginBottom: 6 }}
                    >
                      Due date
                    </div>
                    {isViewingExisting && isViewMode ? (
                      <input
                        type="date"
                        className={styles.inputBox}
                        value={toDateInputValue(taskDueDate)}
                        disabled
                      />
                    ) : (
                      <MiniDatePicker
                        value={taskDueDate}
                        onChange={setTaskDueDate}
                        className={styles.inputBox}
                      />
                    )}
                  </div>
                </div>
              </div>

              {!endOk ? (
                <div className={styles.warn} style={{ marginTop: 6 }}>
                  Task must finish within the day (try shorter duration or
                  earlier start time).
                </div>
              ) : null}

              {/* Footer buttons (match Event UI) */}
              {isCreateMode ? (
                <button
                  type="button"
                  className={styles.createButton}
                  onClick={handleCreateTask}
                  disabled={!endOk}
                  aria-disabled={!endOk}
                >
                  Create Task
                </button>
              ) : (
                <div className={styles.footerRow}>
                  {isViewMode ? (
                    <button
                      type="button"
                      className={styles.createButton}
                      onClick={handleBeginEdit}
                    >
                      Edit task
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.createButton}
                      onClick={handleUpdate}
                      disabled={!endOk}
                      aria-disabled={!endOk}
                    >
                      Update task
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}