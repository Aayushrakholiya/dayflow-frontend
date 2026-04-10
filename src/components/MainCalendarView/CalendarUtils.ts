/*  
*  FILE          : CalendarUtils.ts 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Types, date utilities, and hooks for the MainCalendarView module.
*/ 

import { useState, useEffect, useCallback } from "react";
import type { RefObject } from "react";
import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ViewType = "Day" | "2Day" | "Week" | "Month";

export interface WeekDayItem {
  date: Date;
  label: string;
}

export interface MonthDayItem {
  date: Date;
  isCurrentMonth: boolean;
}

export interface ModalPosition {
  top: number;
  left: number;
}

export interface MainCalendarViewProps {
  onEventsChange?: (events: CalendarEvent[]) => void;
  userCoords?: { lat: number; lng: number } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PURE DATE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const cloneDate = (date: Date): Date => new Date(date.getTime());

export const isSameDay = (first: Date, second: Date): boolean => {
  if (
    !first ||
    !second ||
    !(first instanceof Date) ||
    !(second instanceof Date)
  ) {
    console.warn("isSameDay called with invalid dates:", first, second);
    return false;
  }
  if (isNaN(first.getTime()) || isNaN(second.getTime())) {
    console.warn("isSameDay called with invalid date values:", first, second);
    return false;
  }
  return (
    first.getDate() === second.getDate() &&
    first.getMonth() === second.getMonth() &&
    first.getFullYear() === second.getFullYear()
  );
};

export const formatMonthYear = (date: Date): string =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

export const formatWeekday = (date: Date): string =>
  date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

export const getDayNumber = (date: Date): number => date.getDate();

export const formatDecimalHour12 = (h: number): string => {
  const totalMinutes = Math.round(h * 60);
  const h24 = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const period = h24 < 12 ? "AM" : "PM";
  return `${hour12}:${String(mins).padStart(2, "0")} ${period}`;
};

export const buildTimeSlots = (): string[] =>
  Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const period = i < 12 ? "AM" : "PM";
    return `${hour} ${period}`;
  });

export const getWeekDayItems = (date: Date): WeekDayItem[] => {
  const base = cloneDate(date);
  const day = base.getDay();
  const isoDay = day === 0 ? 7 : day;
  base.setDate(base.getDate() - (isoDay - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const next = cloneDate(base);
    next.setDate(base.getDate() + i);
    return { date: next, label: formatWeekday(next) };
  });
};

/** Returns the current date and the next day — for the mobile 2-day view. */
export const get2DayItems = (date: Date): WeekDayItem[] =>
  Array.from({ length: 2 }, (_, i) => {
    const next = cloneDate(date);
    next.setDate(next.getDate() + i);
    return { date: next, label: formatWeekday(next) };
  });

export const getMonthGridDates = (date: Date): MonthDayItem[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const isoDay = first.getDay() === 0 ? 7 : first.getDay();
  const gridStart = new Date(year, month, 1);
  gridStart.setDate(gridStart.getDate() - (isoDay - 1));
  return Array.from({ length: 42 }, (_, i) => {
    const next = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate(),
    );
    next.setDate(gridStart.getDate() + i);
    return { date: next, isCurrentMonth: next.getMonth() === month };
  });
};

export const getNextDateForView = (
  date: Date,
  view: ViewType,
  direction: 1 | -1,
): Date => {
  const next = cloneDate(date);
  if (view === "Day") next.setDate(next.getDate() + direction);
  else if (view === "2Day") next.setDate(next.getDate() + 2 * direction);
  else if (view === "Month") next.setMonth(next.getMonth() + direction);
  else next.setDate(next.getDate() + 7 * direction);
  return next;
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: useCalendarClock
// Live-updating "now" that ticks every minute + scroll helpers
// ─────────────────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 60;

export function useCalendarClock(gridRef: RefObject<HTMLDivElement | null>) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const scrollToCurrentTime = useCallback(() => {
    if (!gridRef.current) return;
    const offset = (now.getHours() * 60 + now.getMinutes()) / 60;
    const scrollTop = Math.max(0, offset * ROW_HEIGHT - 120);
    gridRef.current.scrollTop = scrollTop;
  }, [now, gridRef]);

  const scrollToTop = useCallback(() => {
    if (gridRef.current) gridRef.current.scrollTop = 0;
  }, [gridRef]);

  return { now, scrollToCurrentTime, scrollToTop };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: useDragToCreate
// Handles mousedown → mousemove → mouseup drag on the time grid
// ─────────────────────────────────────────────────────────────────────────────

function getHourFromMouseY(
  clientY: number,
  gridRef: RefObject<HTMLDivElement | null>,
): number {
  if (!gridRef.current) return 0;
  const rect = gridRef.current.getBoundingClientRect();
  const scrollTop = gridRef.current.scrollTop;
  const yInGrid = clientY - rect.top + scrollTop;
  return Math.max(
    0,
    Math.min(23.75, Math.floor((yInGrid / ROW_HEIGHT) * 4) / 4),
  );
}

interface DragOptions {
  gridRef: RefObject<HTMLDivElement | null>;
  hasOverlap: (dayDate: Date, start: number, end: number) => boolean;
  onDragEnd: (
    dayDate: Date,
    dayIdx: number,
    minHour: number,
    maxHour: number,
  ) => void;
}

export function useDragToCreate({
  gridRef,
  hasOverlap,
  onDragEnd,
}: DragOptions) {
  // On touch-only devices the FAB handles creation — disable drag entirely
  // so accidental touch scrolls don't fire ghost events.
  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  const [isDragging, setIsDragging] = useState(false);
  const [dragDayDate, setDragDayDate] = useState<Date | null>(null);
  const [dragDayIndex, setDragDayIndex] = useState<number | null>(null);
  const [dragStartHour, setDragStartHour] = useState<number | null>(null);
  const [dragEndHour, setDragEndHour] = useState<number | null>(null);

  const dragMinHour =
    isDragging && dragStartHour !== null && dragEndHour !== null
      ? Math.min(dragStartHour, dragEndHour)
      : null;
  const dragMaxHour =
    isDragging && dragStartHour !== null && dragEndHour !== null
      ? Math.max(dragStartHour, dragEndHour) + 0.25
      : null;

  const handleSlotMouseDown = (
    dayDate: Date,
    dayIdx: number,
    clientY: number,
  ) => {
    // Touch devices use the FAB instead — ignore drag initiation
    if (isTouchDevice) return;

    const hour = getHourFromMouseY(clientY, gridRef);
    setIsDragging(true);
    setDragStartHour(hour);
    setDragEndHour(hour);
    setDragDayDate(dayDate);
    setDragDayIndex(dayIdx);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) =>
      setDragEndHour(getHourFromMouseY(e.clientY, gridRef));
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isDragging, gridRef]);

  const handleMouseUp = useCallback(() => {
    if (
      !isDragging ||
      dragStartHour === null ||
      dragEndHour === null ||
      !dragDayDate
    ) {
      setIsDragging(false);
      return;
    }
    const minH = Math.min(dragStartHour, dragEndHour);
    const maxH = Math.max(dragStartHour, dragEndHour) + 0.25;
    setIsDragging(false);
    if (!hasOverlap(dragDayDate, minH, maxH)) {
      onDragEnd(dragDayDate, dragDayIndex ?? 0, minH, maxH);
    }
  }, [
    isDragging,
    dragStartHour,
    dragEndHour,
    dragDayDate,
    dragDayIndex,
    hasOverlap,
    onDragEnd,
  ]);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging, handleMouseUp]);

  return {
    isDragging,
    dragDayIndex,
    dragMinHour,
    dragMaxHour,
    handleSlotMouseDown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: useModalPosition
// Calculates viewport-safe position for the event modal
// ─────────────────────────────────────────────────────────────────────────────
const TIME_COLUMN_WIDTH = 48;
const MODAL_WIDTH = 420;
const MODAL_HEIGHT = 400;
const GAP = 8;

interface ModalPositionOptions {
  gridRef: RefObject<HTMLDivElement | null>;
  isDayView: boolean;
  numCols?: number;
}

export function useModalPosition({ gridRef, isDayView, numCols = 7 }: ModalPositionOptions) {
  const calcPosition = useCallback(
    (colIdx: number, startHour: number): ModalPosition | null => {
      if (!gridRef.current) return null;

      const gridEl = gridRef.current;

      const gridWidth = gridEl.clientWidth - TIME_COLUMN_WIDTH;
      const colWidth = isDayView ? gridWidth : gridWidth / numCols;

      const colLeft = TIME_COLUMN_WIDTH + colIdx * colWidth;
      const colRight = colLeft + colWidth;

      const containerWidth = gridEl.clientWidth;

      let left: number;

      if (containerWidth - colRight - GAP >= MODAL_WIDTH) {
        left = colRight + GAP;
      }
      else if (colLeft - GAP >= MODAL_WIDTH) {
        left = colLeft - MODAL_WIDTH - GAP;
      }
      else {
        left = Math.min(
          Math.max(GAP, colLeft + colWidth / 2 - MODAL_WIDTH / 2),
          containerWidth - MODAL_WIDTH - GAP,
        );
      }

      let top = startHour * ROW_HEIGHT - gridEl.scrollTop;

      const maxTop = Math.max(GAP, gridEl.clientHeight - MODAL_HEIGHT - GAP);
      top = Math.max(GAP, Math.min(top, maxTop));

      return { top, left };
    },
    [gridRef, isDayView, numCols],
  );

  return { calcPosition };
}