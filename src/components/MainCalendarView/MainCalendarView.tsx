// MainCalendarView.tsx — orchestrator.
// State, event logic, and navigation live here.
// Rendering is fully delegated to CalendarViews.tsx.
// Utilities and hooks come from calendarUtils.ts.

import { useCallback, useRef, useState, useEffect } from "react";

import * as api from "../../api";
import type { Task } from "../../api";
import LocationPanel from "../LocationPanel/LocationPanel";
import {
  type ViewType,
  type MainCalendarViewProps,
  isSameDay,
  getWeekDayItems,
  getMonthGridDates,
  getNextDateForView,
  useCalendarClock,
  useDragToCreate,
  useModalPosition,
} from "./CalendarUtils";

import { CalendarHeader, MonthView, TimeGrid } from "./CalendarViews";
import styles from "./calendar.module.css";
import EventCreationModel, { type CalendarEvent } from "../EventCreationModel/EventCreationModel";

const TIME_COLUMN_WIDTH = 48;
const ROW_HEIGHT        = 60;

export default function MainCalendarView({ onEventsChange, userCoords }: MainCalendarViewProps = {}) {

  // ── Navigation ───────────────────────────────────────────────────────────
  const [currentDate,  setCurrentDate]  = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view,         setView]         = useState<ViewType>("Week");
  const [locationEvent, setLocationEvent] = useState<CalendarEvent | null>(null);
  const isDayView   = view === "Day";
  const isMonthView = view === "Month";

  // ── Events ───────────────────────────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Helper function to validate event dates
  const validateEvents = (evts: CalendarEvent[]): CalendarEvent[] => {
    return evts.filter((evt) => {
      if (!evt.date || !(evt.date instanceof Date) || isNaN(evt.date.getTime())) {
        console.warn("Invalid event date, skipping:", evt);
        return false;
      }
      return true;
    });
  };

  // Helper function to sort events by timeline (date and start hour)
  const sortByTimeline = (evts: CalendarEvent[]): CalendarEvent[] => {
    return [...evts].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      
      if (dateA !== dateB) {
        return dateA - dateB; // Sort by date ascending
      }
      
      return a.startHour - b.startHour; // If same date, sort by start hour
    });
  };

  // Single point of truth for all event mutations — always notifies parent
  const pushEvents = useCallback((next: CalendarEvent[]) => {
    const validEvents = validateEvents(next);
    const sortedEvents = sortByTimeline(validEvents);
    setEvents(sortedEvents);
    onEventsChange?.(sortedEvents);
  }, [onEventsChange]);
  // Load events on mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.log("No userId found in localStorage");
      return;
    }

    const loadEventsAndTasks = async () => {
      try {
        console.log("Loading events and tasks for userId:", userId);
        
        // Load events
        let eventsWithDates: CalendarEvent[] = [];
        try {
          const eventsResult = await api.getEvents(userId);
          console.log("Events from API:", eventsResult);
          
          if (eventsResult?.events && Array.isArray(eventsResult.events)) {
            eventsWithDates = eventsResult.events
              .filter((e: CalendarEvent) => e && e.date) // Filter out invalid entries
              .map((e: CalendarEvent) => ({
                ...e,
                date: e.date ? new Date(e.date) : new Date(),
                kind: "event" as const,
              }));
          }
        } catch (eventError) {
          console.error("Failed to load events:", eventError);
          eventsWithDates = [];
        }

        // Load tasks and convert to calendar format
        let tasksAsEvents: CalendarEvent[] = [];
        try {
          const tasksResult = await api.getTasks(userId);
          console.log("Tasks from API:", tasksResult);
          
          if (tasksResult?.tasks && Array.isArray(tasksResult.tasks)) {
            tasksAsEvents = tasksResult.tasks
              .filter((t: Task) => t && t.dueDate) // Filter out invalid entries
              .map((t: Task) => {
                const dueDate = t.dueDate ? new Date(t.dueDate) : new Date();
                return {
                  id: String(t.id),
                  title: t.title,
                  date: dueDate,
                  startHour: t.startHour || 0,
                  endHour: t.endHour || 1,
                  attendees: [],
                  location: "",
                  description: "",
                  videoconferencing: "",
                  color: t.color || "#6091F0",
                  kind: "task" as const,
                  dueDate: dueDate,
                  durationMinutes: t.durationMinutes || 60,
                } as CalendarEvent;
              });
          }
        } catch (taskError) {
          console.error("Failed to load tasks:", taskError);
          tasksAsEvents = [];
        }

        console.log("All events:", [...eventsWithDates, ...tasksAsEvents]);

        // Combine both arrays (pushEvents will handle sorting)
        pushEvents([...eventsWithDates, ...tasksAsEvents]);
      } catch (error) {
        console.error("Unexpected error loading events and tasks:", error);
        // Set empty array on error so calendar still renders
        pushEvents([]);
      }
    };

    loadEventsAndTasks();
  }, [pushEvents]);

  const handleDeleteEvent = async (id: string | number) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const eventToDelete = events.find((e) => e.id === id);
      if (!eventToDelete) {
        console.warn("Event not found for deletion:", id);
        return;
      }

      console.log("Deleting event/task:", eventToDelete);

      if (eventToDelete.kind === "task") {
        await api.deleteTask(String(id), userId);
      } else {
        await api.deleteEvent(String(id), userId);
      }

      pushEvents(events.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete event/task:", error);
    }
  };

  const handleCreateEvent = async (event: CalendarEvent) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    if (hasOverlap(event.date, event.startHour, event.endHour)) return;

    try {
      if (event.kind === "task") {
        // Save as task
        const result = await api.createTask(
          {
            title: event.title,
            dueDate: event.date,
            startHour: event.startHour,
            endHour: event.endHour,
            durationMinutes: event.durationMinutes || 60,
            color: event.color,
          },
          userId
        );
        console.log("Created task response:", result);
        
        const dueDate = result.task?.dueDate ? new Date(result.task.dueDate) : event.date;
        const taskId: string = result.task?.id || event.id;
        const newTask: CalendarEvent = {
          id: taskId,
          title: result.task?.title || event.title,
          date: dueDate,
          startHour: result.task?.startHour || event.startHour,
          endHour: result.task?.endHour || event.endHour,
          attendees: [],
          location: "",
          description: "",
          videoconferencing: "",
          color: result.task?.color || event.color,
          kind: "task" as const,
          dueDate: dueDate,
          durationMinutes: result.task?.durationMinutes || event.durationMinutes || 60,
        };
        
        pushEvents([...events, newTask]);
      } else {
        // Save as event
        const result = await api.createEvent(event, userId);
        console.log("Created event response:", result);
        
        const eventDate = result.event?.date ? new Date(result.event.date) : event.date;
        const eventId: string = result.event?.id || event.id;
        const newEvent: CalendarEvent = {
          id: eventId,
          title: result.event?.title || event.title,
          date: eventDate,
          startHour: result.event?.startHour || event.startHour,
          endHour: result.event?.endHour || event.endHour,
          attendees: result.event?.attendees || event.attendees || [],
          location: result.event?.location || event.location || "",
          description: result.event?.description || event.description || "",
          videoconferencing: result.event?.videoconferencing || event.videoconferencing || "",
          color: result.event?.color || event.color,
          kind: "event" as const,
        };
        
        pushEvents([...events, newEvent]);
      }
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to create event/task:", error);
    }
  };

  const handleUpdateEvent = async (updated: CalendarEvent) => {
    const userId = localStorage.getItem("userId");
    if (!userId || !updated.id) return;

    if (hasOverlap(updated.date, updated.startHour, updated.endHour, updated.id)) return;

    try {
      if (updated.kind === "task") {
        await api.updateTask(
          String(updated.id),
          {
            title: updated.title,
            dueDate: updated.date,
            startHour: updated.startHour,
            endHour: updated.endHour,
            durationMinutes: updated.durationMinutes || 60,
            color: updated.color,
          },
          userId
        );
      } else {
        await api.updateEvent(String(updated.id), updated, userId);
      }

      // Ensure date is always a valid Date object
      const validDate = updated.date instanceof Date ? updated.date : new Date(updated.date);
      const updatedWithDate = { ...updated, date: validDate };
      
      pushEvents(
        events.map((e) =>
          e.id === updated.id 
            ? updatedWithDate
            : e
        )
      );
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to update event/task:", error);
    }
  };

  // ── Modal ────────────────────────────────────────────────────────────────
  const [modalOpen,      setModalOpen]      = useState(false);
  const [modalDate,      setModalDate]      = useState<Date>(new Date());
  const [modalStartHour, setModalStartHour] = useState(0);
  const [modalEndHour,   setModalEndHour]   = useState(1);
  const [modalPosition,  setModalPosition]  = useState<{ top: number; left: number } | null>(null);
  const [modalDayIndex,  setModalDayIndex]  = useState<number | null>(null);
  const [selectedEvent,  setSelectedEvent]  = useState<CalendarEvent | null>(null);
  const [modalMode,      setModalMode]      = useState<"create" | "view" | "edit">("create");

  // ── Derived grid data ────────────────────────────────────────────────────
  const weekDayItems  = getWeekDayItems(currentDate);
  const monthGridDays = getMonthGridDates(currentDate);

  // ── Hooks ────────────────────────────────────────────────────────────────
  const gridBodyRef = useRef<HTMLDivElement | null>(null);
  const { now, scrollToCurrentTime, scrollToTop } = useCalendarClock(gridBodyRef);
  const today = now;

  const { calcPosition } = useModalPosition({ gridRef: gridBodyRef, isDayView });

  // Auto-scroll to current time on page load (for Day/Week views)
  useEffect(() => {
    if (!isMonthView) {
      scrollToCurrentTime();
    }
  }, [view, isMonthView, scrollToCurrentTime]);

  // ── Overlap detection ────────────────────────────────────────────────────
  const getEventsForDay = useCallback(
    (date: Date) => {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn("Invalid date passed to getEventsForDay:", date);
        return [];
      }
      return events.filter((e) => {
        if (!e.date || !(e.date instanceof Date) || isNaN(e.date.getTime())) {
          console.warn("Event has invalid date, skipping:", e);
          return false;
        }
        return isSameDay(e.date, date);
      });
    },
    [events],
  );

  const hasOverlap = useCallback(
    (dayDate: Date, start: number, end: number, excludeId?: string) => {
      const dayEvents = getEventsForDay(dayDate);
      return dayEvents.some(
        (e) => e.id !== excludeId && start < e.endHour && end > e.startHour,
      );
    },
    [getEventsForDay],
  );

  // ── Drag to create ───────────────────────────────────────────────────────
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

  // ── Open existing event ──────────────────────────────────────────────────
  const openViewEventModal = (evt: CalendarEvent) => {
    const colIdx = isDayView
      ? 0
      : Math.max(0, weekDayItems.findIndex((item) => isSameDay(item.date, new Date(evt.date))));

    setSelectedEvent(evt);
    setModalMode("view");
    setModalDate(evt.date);
    setModalStartHour(evt.startHour);
    setModalEndHour(evt.endHour);
    setModalDayIndex(colIdx);
    setModalPosition(calcPosition(colIdx, evt.startHour));
    setModalOpen(true);
  };

  // ── Navigation handlers ──────────────────────────────────────────────────
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
    if (isSameDay(next, new Date())) { scrollToCurrentTime(); } else { scrollToTop(); }
  };

  // ── Time indicator geometry ──────────────────────────────────────────────
  const todayIndex         = weekDayItems.findIndex((item) => isSameDay(item.date, today));
  const currentMinutes     = today.getHours() * 60 + today.getMinutes();
  const timeIndicatorTop   = (currentMinutes / 60) * ROW_HEIGHT;
  const timeIndicatorLeft  = isDayView
    ? `${TIME_COLUMN_WIDTH}px`
    : todayIndex >= 0
      ? `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${todayIndex} / 7)`
      : "0px";
  const timeIndicatorWidth = isDayView
    ? `calc(100% - ${TIME_COLUMN_WIDTH}px)`
    : `calc((100% - ${TIME_COLUMN_WIDTH}px) / 7)`;
  const showTimeIndicator  = !isMonthView &&
    (isDayView ? isSameDay(currentDate, today) : todayIndex >= 0);

  // ── Render ───────────────────────────────────────────────────────────────
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

      <div className={styles.gridWrapper}>
        {isMonthView ? (
          <MonthView
            today={today}
            weekDayItems={weekDayItems}
            monthGridDays={monthGridDays}
            events={events}
            onEventClick={openViewEventModal}
            onEventDelete={handleDeleteEvent}
          />
        ) : (
          <TimeGrid
            key={view}
            isDayView={isDayView}
            currentDate={currentDate}
            today={today}
            weekDayItems={weekDayItems}
            events={events}
            onEventClick={openViewEventModal}
            onEventDelete={handleDeleteEvent}
            onViewLocation={setLocationEvent}
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
             {locationEvent && (
        <div style={{ position: "fixed", top: 80, right: 24, zIndex: 2000 }}>
        <LocationPanel event={locationEvent} onClose={() => setLocationEvent(null)} userCoords={userCoords ?? null} />
        </div>
      )}
    </section>
  );
}