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
          <span aria-hidden="true">📅</span>
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
    globalThis.addEventListener("scroll", updateRect, true);
    globalThis.addEventListener("resize", updateRect);
    return () => {
      globalThis.removeEventListener("scroll", updateRect, true);
      globalThis.removeEventListener("resize", updateRect);
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
                <span className={styles.locationDropdownPin}>📍</span>
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
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAddAttendee = () => {
    const trimmed = attendeeInput.trim();
    if (trimmed && !attendees.includes(trimmed)) {
      setAttendees((prev) => [...prev, trimmed]);
      setAttendeeInput("");
    }
  };

  const handleRemoveAttendee = (email: string) => {
    setAttendees((prev) => prev.filter((a) => a !== email));
  };

  // ===== Create Event =====
  const handleCreate = () => {
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: title || "(No title)",
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      startHour,
      endHour,
      attendees,
      location,
      locationCoords: locationCoords ?? undefined,
      description,
      videoconferencing,
      color: "#D3D406",
      kind: "event",
    };
    onCreate(newEvent);
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
      color: "#6091F0",
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
      attendees,
      location,
      locationCoords: locationCoords ?? undefined,
      description,
      videoconferencing,
      color: event.color,
    };

    onUpdate?.(updatedEvent);
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
          position
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
                <span className={styles.icon}>🙂</span>
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
                <span className={styles.icon}>📅</span>

                {isCreateMode || isViewMode ? (
                  <span className={styles.dateTimeText}>
                    {dateLabel}&nbsp;&nbsp;{timeRange}
                  </span>
                ) : (
                  <div className={styles.editWrap}>
                    <MiniDatePicker
                      value={editDate}
                      onChange={setEditDate}
                      className={styles.dateInput}
                    />
                    <div className={styles.timeRow}>
                      <select
                        className={styles.timeSelect}
                        value={editStartHour}
                        onChange={(e) =>
                          setEditStartHour(Number(e.target.value))
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
                        value={editEndHour}
                        onChange={(e) => setEditEndHour(Number(e.target.value))}
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

                    {editEndHour <= editStartHour ? (
                      <div className={styles.warn}>
                        End time should be after start time
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className={styles.formRow}>
                <span className={styles.icon}>👥</span>
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
                        type="email"
                        className={styles.fieldInput}
                        placeholder="Add attendee email"
                        value={attendeeInput}
                        onChange={(e) => setAttendeeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddAttendee();
                          }
                        }}
                        onBlur={() => {
                          if (
                            attendeeInput.trim() === "" &&
                            attendees.length === 0
                          ) {
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
                <span className={styles.icon}>🎥</span>
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
                <span className={styles.icon}>📍</span>
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
                <span className={styles.icon}>📝</span>
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
                      📍 View Location & ETA
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
                <span className={styles.icon}>🙂</span>
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
                <span className={styles.icon}>⌛</span>

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
                <span className={styles.icon}>🕓</span>
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
