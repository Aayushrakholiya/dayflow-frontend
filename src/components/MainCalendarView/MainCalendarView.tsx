/*  
*  FILE          : MainCalendarView.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Main calendar orchestrator managing state, event logic, and navigation.
*/ 

import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import ReactDOM from "react-dom";
import { useConflictDetection } from "../Conflict/UseConflictDetection";
import { ConflictPanel }        from "../Conflict/ConflictBanner";
import type { UnifiedEvent }    from "../Conflict/ConflictType";

import * as api from "../../api";
import type { Task } from "../../api";
import LocationPanel from "../LocationPanel/LocationPanel";
import {
  type ViewType,
  type MainCalendarViewProps,
  isSameDay,
  getWeekDayItems,
  get2DayItems,
  getMonthGridDates,
  getNextDateForView,
  useCalendarClock,
  useDragToCreate,
  useModalPosition,
} from "./CalendarUtils";

import { CalendarHeader, MonthView, TimeGrid, MobileViewSwitcher, MobileHeader, MobileFAB } from "./CalendarViews";
import styles from "./calendar.module.css";
import EventCreationModel, { type CalendarEvent } from "../EventCreationModel/EventCreationModel";
import {
  type ImportedCalendarEvent,
  getImportedEvents,
  syncCalendar,
  getCalendarConnectionStatus,
} from "./CalendarImportService";
import ImportedEventModal from "./ImportantEventModal";

const TIME_COLUMN_WIDTH = 48;
const ROW_HEIGHT        = 60;

/* ── Converters: CalendarEvent / ImportedCalendarEvent → UnifiedEvent ─────── */
function ownToUnified(e: CalendarEvent): UnifiedEvent {
  return {
    id:        String(e.id),
    title:     e.title,
    date:      e.date instanceof Date ? e.date : new Date(e.date),
    startHour: e.startHour,
    endHour:   e.endHour,
    location:  e.location ?? "",
    color:     e.color ?? "#6091F0",
    kind:      e.kind ?? "event",
  };
}

function importedToUnified(e: ImportedCalendarEvent): UnifiedEvent {
  return {
    id:           `imported-${e.id}`,
    title:        e.title,
    date:         e.date instanceof Date ? e.date : new Date(e.date),
    startHour:    e.startHour,
    endHour:      e.endHour,
    location:     e.locationOverride ?? e.location ?? "",
    color:        e.color,
    kind:         "imported",
    source:       e.source,
    calendarName: e.calendarName,
  };
}

export default function MainCalendarView({
  onEventsChange,
  onImportedEventsChange,
  onRegisterReloadImported,
  onRegisterOpenForEdit,
  userCoords,
}: MainCalendarViewProps & {
  onImportedEventsChange?: (events: ImportedCalendarEvent[]) => void;
  onRegisterReloadImported?: (fn: () => void) => void;
  onRegisterOpenForEdit?: (fn: (e: CalendarEvent) => void) => void;
} = {}) {

  // ── Navigation ────────────────────────────────────────────────────────────
  const [currentDate,  setCurrentDate]  = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view,         setView]         = useState<ViewType>(
    () => (typeof window !== "undefined" && window.innerWidth < 768) ? "2Day" : "Week"
  );
  const [locationEvent, setLocationEvent] = useState<CalendarEvent | null>(null);
  const isDayView   = view === "Day";
  const is2DayView  = view === "2Day";
  const isMonthView = view === "Month";

  // ── Own events ────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // ── Imported events ───────────────────────────────────────────────────────
  const [importedEvents,        setImportedEvents]        = useState<ImportedCalendarEvent[]>([]);
  const [selectedImportedEvent, setSelectedImportedEvent] = useState<ImportedCalendarEvent | null>(null);
  const [importedModalPosition, setImportedModalPosition] = useState<{ top: number; left: number } | null>(null);

  // ── Validation + sort helpers ─────────────────────────────────────────────
  const validateEvents = (evts: CalendarEvent[]): CalendarEvent[] =>
    evts.filter((evt) => {
      if (!evt.date || !(evt.date instanceof Date) || isNaN(evt.date.getTime())) {
        console.warn("Invalid event date, skipping:", evt);
        return false;
      }
      return true;
    });

  const sortByTimeline = (evts: CalendarEvent[]): CalendarEvent[] =>
    [...evts].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.startHour - b.startHour;
    });

  const pushEvents = useCallback((next: CalendarEvent[]) => {
    const sorted = sortByTimeline(validateEvents(next));
    setEvents(sorted);
    onEventsChange?.(sorted);
  }, [onEventsChange]);

  const pushImportedEvents = useCallback((next: ImportedCalendarEvent[]) => {
    setImportedEvents(next);
    onImportedEventsChange?.(next);
  }, [onImportedEventsChange]);

  // ── On-demand reload of imported events ───────────────────────────────────
  const loadImportedEvents = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const imported = await getImportedEvents(userId);
      pushImportedEvents(imported);
    } catch (err) {
      console.error("Failed to load imported events:", err);
      pushImportedEvents([]);
    }
  }, [pushImportedEvents]);

  useEffect(() => {
    onRegisterReloadImported?.(loadImportedEvents);
  }, [onRegisterReloadImported, loadImportedEvents]);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    let cancelled = false;

    const loadAll = async () => {
      let eventsWithDates: CalendarEvent[] = [];
      try {
        const result = await api.getEvents(userId);
        if (result?.events && Array.isArray(result.events)) {
          eventsWithDates = result.events
            .filter((e: CalendarEvent) => e && e.date)
            .map((e: CalendarEvent) => ({
              ...e,
              date: e.date ? new Date(e.date) : new Date(),
              kind: "event" as const,
            }));
        }
      } catch (err) { console.error("Failed to load events:", err); }

      let tasksAsEvents: CalendarEvent[] = [];
      try {
        const result = await api.getTasks(userId);
        if (result?.tasks && Array.isArray(result.tasks)) {
          tasksAsEvents = result.tasks
            .filter((t: Task) => t && t.dueDate)
            .map((t: Task) => {
              const dueDate = t.dueDate ? new Date(t.dueDate) : new Date();
              return {
                id: String(t.id), title: t.title, date: dueDate,
                startHour: t.startHour || 0, endHour: t.endHour || 1,
                attendees: [], location: "", description: "", videoconferencing: "",
                color: t.color || "#6091F0", kind: "task" as const,
                dueDate, durationMinutes: t.durationMinutes || 60,
              } as CalendarEvent;
            });
        }
      } catch (err) { console.error("Failed to load tasks:", err); }

      let imported: ImportedCalendarEvent[] = [];
      try {
        imported = await getImportedEvents(userId);
      } catch (err) { console.error("Failed to load imported events:", err); }

      if (!cancelled) {
        pushEvents([...eventsWithDates, ...tasksAsEvents]);
        pushImportedEvents(imported);
      }

      const backgroundSync = async () => {
        try {
          const [googleConnected, microsoftConnected] = await Promise.all([
            getCalendarConnectionStatus(userId, "google"),
            getCalendarConnectionStatus(userId, "microsoft"),
          ]);
          const syncs = await Promise.allSettled([
            googleConnected    ? syncCalendar(userId, "google")    : Promise.resolve(),
            microsoftConnected ? syncCalendar(userId, "microsoft") : Promise.resolve(),
          ]);
          const anySynced = syncs.some(
            (r, i) => (i === 0 ? googleConnected : microsoftConnected) && r.status === "fulfilled",
          );
          if (anySynced && !cancelled) {
            const fresh = await getImportedEvents(userId);
            if (!cancelled) pushImportedEvents(fresh);
          }
        } catch (err) { console.error("Background sync failed:", err); }
      };

      void backgroundSync();
    };

    void loadAll();
    return () => { cancelled = true; };
  }, [pushEvents, pushImportedEvents]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleDeleteEvent = async (id: string | number) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const evt = events.find((e) => e.id === id);
      if (!evt) return;
      if (evt.kind === "task") await api.deleteTask(String(id), userId);
      else                     await api.deleteEvent(String(id), userId);
      pushEvents(events.filter((e) => e.id !== id));
      toast.success((evt.kind === "task" ? "Task" : "Event") + " deleted!");
    } catch (err) { 
      console.error("Failed to delete:", err);
      toast.error("Failed to delete event/task");
    }
  };

  const handleCreateEvent = async (event: CalendarEvent) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    if (hasOverlap(event.date, event.startHour, event.endHour)) {
      toast.warning("Schedule Conflict: " + (event.title || "Untitled") + " overlaps with another event");
      return;
    }
    try {
      if (event.kind === "task") {
        const result = await api.createTask({
          title: event.title, dueDate: event.date,
          startHour: event.startHour, endHour: event.endHour,
          durationMinutes: event.durationMinutes || 60, color: event.color,
        }, userId);
        const dueDate = result.task?.dueDate ? new Date(result.task.dueDate) : event.date;
        pushEvents([...events, {
          id: result.task?.id || event.id, title: result.task?.title || event.title,
          date: dueDate, startHour: result.task?.startHour || event.startHour,
          endHour: result.task?.endHour || event.endHour, attendees: [],
          location: "", description: "", videoconferencing: "",
          color: result.task?.color || event.color, kind: "task" as const,
          dueDate, durationMinutes: result.task?.durationMinutes || event.durationMinutes || 60,
        }]);
        toast.success("Task created: " + (result.task?.title || event.title));
      } else {
        const result = await api.createEvent(event, userId);
        const eventDate = result.event?.date ? new Date(result.event.date) : event.date;
        pushEvents([...events, {
          id: result.event?.id || event.id, title: result.event?.title || event.title,
          date: eventDate, startHour: result.event?.startHour || event.startHour,
          endHour: result.event?.endHour || event.endHour,
          attendees: result.event?.attendees || event.attendees || [],
          location: result.event?.location || event.location || "",
          description: result.event?.description || event.description || "",
          videoconferencing: result.event?.videoconferencing || event.videoconferencing || "",
          color: result.event?.color || event.color, kind: "event" as const,
        }]);
        toast.success("Event created: " + (result.event?.title || event.title));
      }
      setModalOpen(false);
    } catch (err) { 
      console.error("Failed to create:", err);
      toast.error("Failed to create event/task");
    }
  };

  const handleUpdateEvent = async (updated: CalendarEvent) => {
    const userId = localStorage.getItem("userId");
    if (!userId || !updated.id) return;
    if (hasOverlap(updated.date, updated.startHour, updated.endHour, updated.id)) {
      toast.warning("Schedule Conflict: " + (updated.title || "Untitled") + " overlaps with another event");
      return;
    }
    try {
      if (updated.kind === "task") {
        await api.updateTask(String(updated.id), {
          title: updated.title, dueDate: updated.date,
          startHour: updated.startHour, endHour: updated.endHour,
          durationMinutes: updated.durationMinutes || 60, color: updated.color,
        }, userId);
      } else {
        await api.updateEvent(String(updated.id), updated, userId);
      }
      const validDate = updated.date instanceof Date ? updated.date : new Date(updated.date);
      pushEvents(events.map((e) => e.id === updated.id ? { ...updated, date: validDate } : e));
      setModalOpen(false);
      toast.success((updated.kind === "task" ? "Task" : "Event") + " updated: " + updated.title);
    } catch (err) { 
      console.error("Failed to update:", err);
      toast.error("Failed to update event/task");
    }
  };

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen,      setModalOpen]      = useState(false);
  const [modalDate,      setModalDate]      = useState<Date>(new Date());
  const [modalStartHour, setModalStartHour] = useState(0);
  const [modalEndHour,   setModalEndHour]   = useState(1);
  const [modalPosition,  setModalPosition]  = useState<{ top: number; left: number } | null>(null);
  const [modalDayIndex,  setModalDayIndex]  = useState<number | null>(null);
  const [selectedEvent,  setSelectedEvent]  = useState<CalendarEvent | null>(null);
  const [modalMode,      setModalMode]      = useState<"create" | "view" | "edit">("create");

  // ── Grid / clock ──────────────────────────────────────────────────────────
  const weekDayItems  = is2DayView ? get2DayItems(currentDate) : getWeekDayItems(currentDate);
  const monthGridDays = getMonthGridDates(currentDate);
  const gridBodyRef   = useRef<HTMLDivElement | null>(null);
  const { now, scrollToCurrentTime, scrollToTop } = useCalendarClock(gridBodyRef);
  const today   = now;
  const numCols = isDayView ? 1 : is2DayView ? 2 : 7;
  const { calcPosition } = useModalPosition({ gridRef: gridBodyRef, isDayView, numCols });

  useEffect(() => {
    if (!isMonthView) scrollToCurrentTime();
  }, [view, isMonthView, scrollToCurrentTime]);

  // ── Overlap detection ─────────────────────────────────────────────────────
  const getEventsForDay = useCallback((date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return [];
    return events.filter((e) => {
      if (!e.date || !(e.date instanceof Date) || isNaN(e.date.getTime())) return false;
      return isSameDay(e.date, date);
    });
  }, [events]);

  const hasOverlap = useCallback(
    (dayDate: Date, start: number, end: number, excludeId?: string) =>
      getEventsForDay(dayDate).some(
        (e) => e.id !== excludeId && start < e.endHour && end > e.startHour,
      ),
    [getEventsForDay],
  );

  // ── Drag to create ────────────────────────────────────────────────────────
  const { isDragging, dragMinHour, dragMaxHour, dragDayIndex, handleSlotMouseDown } =
    useDragToCreate({
      gridRef: gridBodyRef,
      hasOverlap,
      onDragEnd: (dayDate, dayIdx, minH, maxH) => {
        setModalDate(new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()));
        setModalStartHour(minH);
        setModalEndHour(maxH);
        setModalDayIndex(dayIdx);
        setModalPosition(calcPosition(dayIdx, minH));
        setSelectedEvent(null);
        setModalMode("create");
        setModalOpen(true);
      },
    });

  // ── Open event modal ──────────────────────────────────────────────────────
  const openViewEventModal = useCallback(
    (evt: CalendarEvent, mode: "view" | "edit" = "view") => {
      const colIdx = isDayView
        ? 0
        : Math.max(0, weekDayItems.findIndex((item) => isSameDay(item.date, new Date(evt.date))));
      setSelectedEvent(evt);
      setModalMode(mode);
      setModalDate(evt.date);
      setModalStartHour(evt.startHour);
      setModalEndHour(evt.endHour);
      setModalDayIndex(colIdx);
      setModalPosition(calcPosition(colIdx, evt.startHour));
      setModalOpen(true);
    },
    [isDayView, weekDayItems, calcPosition, setSelectedEvent, setModalMode, setModalDate, setModalStartHour, setModalEndHour, setModalDayIndex, setModalPosition, setModalOpen],
  );

  useEffect(() => {
    if (!onRegisterOpenForEdit) return;
    onRegisterOpenForEdit((e: CalendarEvent) => openViewEventModal(e, "edit"));
  }, [onRegisterOpenForEdit, openViewEventModal]);

  const openImportedEventModal = (evt: ImportedCalendarEvent) => {
    const colIdx = isDayView
      ? 0
      : Math.max(0, weekDayItems.findIndex((item) => isSameDay(item.date, evt.date)));
    setSelectedImportedEvent(evt);
    setImportedModalPosition(calcPosition(colIdx, evt.startHour));
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleToday = () => {
    const d = new Date();
    setCurrentDate(d);
    setSelectedDate(d);
    scrollToCurrentTime();
  };
  const handlePrevious = () => {
    const next = getNextDateForView(currentDate, view, -1);
    setCurrentDate(next);
    setSelectedDate(next);
  };
  const handleNext = () => {
    const next = getNextDateForView(currentDate, view, 1);
    setCurrentDate(next);
    setSelectedDate(next);
  };
  const handleDatePickerChange = (next: Date) => {
    setSelectedDate(next);
    setCurrentDate(next);
    if (isSameDay(next, new Date())) scrollToCurrentTime(); else scrollToTop();
  };

  // ── Time indicator ────────────────────────────────────────────────────────
  const todayIndex        = weekDayItems.findIndex((item) => isSameDay(item.date, today));
  const currentMinutes    = today.getHours() * 60 + today.getMinutes();
  const timeIndicatorTop  = (currentMinutes / 60) * ROW_HEIGHT;
  const timeIndicatorLeft = isDayView
    ? `${TIME_COLUMN_WIDTH}px`
    : todayIndex >= 0
      ? `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${todayIndex} / ${numCols})`
      : "0px";
  const timeIndicatorWidth = isDayView
    ? `calc(100% - ${TIME_COLUMN_WIDTH}px)`
    : `calc((100% - ${TIME_COLUMN_WIDTH}px) / ${numCols})`;
  const showTimeIndicator = !isMonthView &&
    (isDayView ? isSameDay(currentDate, today) : todayIndex >= 0);

  // ── Conflict detection ────────────────────────────────────────────────────
  // Build a unified list for the currently-visible day.
  // We check the selectedDate (the day the user is focused on in day/week view).
  // All sources — own events, tasks, Google, Microsoft — are included.
  const conflictDayEvents = useMemo<UnifiedEvent[]>(() => {
    const focus = selectedDate;
    const own = events
      .filter((e) => {
        const d = e.date instanceof Date ? e.date : new Date(e.date);
        return isSameDay(d, focus);
      })
      .map(ownToUnified);

    const imp = importedEvents
      .filter((e) => {
        const d = e.date instanceof Date ? e.date : new Date(e.date);
        return isSameDay(d, focus);
      })
      .map(importedToUnified);

    return [...own, ...imp].sort((a, b) => a.startHour - b.startHour);
  }, [events, importedEvents, selectedDate]);

  const {
    visibleWarnings,
    conflictEventIds,
    handleDismiss,
    handleSnooze,
  } = useConflictDetection(conflictDayEvents);

  // ── Edit handler for conflict banners ─────────────────────────────────────────────
  const handleEditConflictEvent = useCallback((u: UnifiedEvent) => {
    // Handle both own and imported events
    if (u.kind === "imported") {
      const imported = importedEvents.find((e) => `imported-${e.id}` === u.id);
      if (imported) setSelectedImportedEvent(imported);
      return;
    }
    
    const original = events.find((e) => String(e.id) === u.id);
    if (original) openViewEventModal(original, "edit");
  }, [events, importedEvents, openViewEventModal]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className={styles.calendar} aria-label="Calendar">

      <CalendarHeader
        currentDate={currentDate}
        selectedDate={selectedDate}
        view={view}
        onToday={handleToday}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onViewChange={setView}
        onDatePickerChange={handleDatePickerChange}
      />

      <MobileHeader
        currentDate={currentDate}
        onToday={handleToday}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      <div className={styles.gridWrapper}>
        <MobileViewSwitcher view={view} onViewChange={setView} />
        {isMonthView ? (
          <>
            <MonthView
              today={today}
              weekDayItems={weekDayItems}
              monthGridDays={monthGridDays}
              events={events}
              importedEvents={importedEvents}
              onEventClick={openViewEventModal}
              onEventDelete={handleDeleteEvent}
              onImportedEventClick={openImportedEventModal}
              conflictEventIds={conflictEventIds}
            />
            <MobileFAB
              currentDate={currentDate}
              onPress={(date, startHour, endHour) => {
                setModalDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
                setModalStartHour(startHour);
                setModalEndHour(endHour);
                setModalDayIndex(0);
                setModalPosition(null);
                setSelectedEvent(null);
                setModalMode("create");
                setModalOpen(true);
              }}
            />
          </>
        ) : (
          <TimeGrid
            key={view}
            isDayView={isDayView}
            is2DayView={is2DayView}
            currentDate={currentDate}
            today={today}
            weekDayItems={weekDayItems}
            events={events}
            importedEvents={importedEvents}
            onEventClick={openViewEventModal}
            onEventDelete={handleDeleteEvent}
            onViewLocation={setLocationEvent}
            onImportedEventClick={openImportedEventModal}
            isDragging={isDragging}
            dragMinHour={dragMinHour}
            dragMaxHour={dragMaxHour}
            dragDayIndex={dragDayIndex}
            onSlotMouseDown={handleSlotMouseDown}
            modalOpen={modalOpen}
            modalDayIndex={modalDayIndex}
            modalStartHour={modalStartHour}
            modalEndHour={modalEndHour}
            showTimeIndicator={showTimeIndicator}
            timeIndicatorTop={timeIndicatorTop}
            timeIndicatorLeft={timeIndicatorLeft}
            timeIndicatorWidth={timeIndicatorWidth}
            gridBodyRef={gridBodyRef}
            conflictEventIds={conflictEventIds}
            onMobileFABPress={(date, startHour, endHour) => {
              setModalDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
              setModalStartHour(startHour);
              setModalEndHour(endHour);
              setModalDayIndex(0);
              setModalPosition(null);
              setSelectedEvent(null);
              setModalMode("create");
              setModalOpen(true);
            }}
          />
        )}
      </div>

      {modalOpen && (
        <EventCreationModel
          key={selectedEvent?.id ?? `${modalDate.toISOString()}-${modalStartHour}-${modalEndHour}`}
          date={modalDate}
          startHour={modalStartHour}
          endHour={modalEndHour}
          position={modalPosition}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreateEvent}
          mode={modalMode}
          event={selectedEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          onViewLocation={setLocationEvent}
          userCoords={userCoords ?? null}
        />
      )}

      {selectedImportedEvent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedImportedEvent(null);
          }}
        >
          <ImportedEventModal
            event={selectedImportedEvent}
            userId={localStorage.getItem("userId") ?? ""}
            position={window.innerWidth > 768 ? importedModalPosition : null}
            userCoords={userCoords ?? null}
            onClose={() => setSelectedImportedEvent(null)}
            onLocationUpdated={(updated: ImportedCalendarEvent) => {
              setImportedEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
              setSelectedImportedEvent(updated);
            }}
            onViewLocation={(locationStr: string) => {
              setLocationEvent({
                id: `imported-${selectedImportedEvent.id}`,
                title: selectedImportedEvent.title,
                date: selectedImportedEvent.date,
                startHour: selectedImportedEvent.startHour,
                endHour: selectedImportedEvent.endHour,
                location: locationStr,
                color: selectedImportedEvent.color,
                attendees: selectedImportedEvent.attendees,
                description: selectedImportedEvent.description ?? "",
                videoconferencing: selectedImportedEvent.videoconferencing ?? "",
                kind: "event",
              } as CalendarEvent);
              setSelectedImportedEvent(null);
            }}
          />
        </div>
      )}

      {locationEvent && ReactDOM.createPortal(
        <div className={styles.locationPanelAnchor}>
          <LocationPanel
            event={locationEvent}
            onClose={() => setLocationEvent(null)}
            userCoords={userCoords ?? null}
          />
        </div>,
        document.body,
      )}

      {/* ── Floating conflict panel — portalled to body so it overlays everything ── */}
      {ReactDOM.createPortal(
        <ConflictPanel
          warnings={visibleWarnings}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          onEdit={handleEditConflictEvent}
        />,
        document.body,
      )}

    </section>
  );
}