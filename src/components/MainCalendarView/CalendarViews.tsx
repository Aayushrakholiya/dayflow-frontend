/*  
*  FILE          : CalendarViews.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    All subcomponents for MainCalendarView including CalendarHeader, MonthView, and TimeGrid.
*/ 

import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";
import type { ImportedCalendarEvent } from "./CalendarImportService";
import type { ViewType, WeekDayItem, MonthDayItem } from "./CalendarUtils";
import {
  isSameDay,
  formatMonthYear,
  formatWeekday,
  getDayNumber,
  formatDecimalHour12,
  buildTimeSlots,
} from "./CalendarUtils";
import styles from "./calendar.module.css";
import deleteIcon from "../../assets/icon_delete.png";
import WeatherWidget, { WeatherForecastPill } from "../WeatherWidget/WeatherWidget";
import type { ForecastDay } from "../WeatherWidget/WeatherWidget";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CalendarDatePicker
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DatePickerProps {
  value: Date;
  onChange: (d: Date) => void;
  className?: string;
}

export function CalendarDatePicker({ value, onChange, className }: DatePickerProps) {
  const [month, setMonth] = useState<Date>(value);

  const goToPrev = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goToNext = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const goToToday = () => {
    const today = new Date();
    const normalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    setMonth(normalized);
    onChange(normalized);
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={`${className ?? ""} ${styles.datePickerTrigger}`}>
          {value.toLocaleDateString("en-CA")}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display: "inline", marginLeft: "6px", verticalAlign: "middle"}} aria-hidden="true">
            <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C13.3313 22 13.8509 22 14.3769 21.9992C15.1689 21.998 15.5649 21.9974 15.9316 21.8452C16.2983 21.693 16.5815 21.4099 17.1477 20.8436L19.8436 18.1477C20.4099 17.5815 20.693 17.2983 20.8452 16.9316C20.9974 16.5649 20.998 16.1689 20.9992 15.3769C21 14.8509 21 14.3313 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" />
            <path d="M15 22C15.0359 19.5168 15.2201 18.109 16.1646 17.1646C17.109 16.2201 18.5168 16.0359 21 16" />
            <path d="M16 2V6M8 2V6" />
            <path d="M3 10H21" />
          </svg>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content sideOffset={10} align="end" side="bottom" className={styles.datePickerContent}>
          <div className={styles.datePickerTopBar}>
            <div className={styles.datePickerTopBarCenter}>
              <button type="button" className={styles.dpNavBtn} onClick={goToPrev} aria-label="Previous month">‹</button>
              <button type="button" className={styles.datePickerTodayBtn} onClick={goToToday}>Today</button>
              <button type="button" className={styles.dpNavBtn} onClick={goToNext} aria-label="Next month">›</button>
            </div>
            <Popover.Close asChild>
              <button type="button" className={styles.datePickerCloseBtn}>✕</button>
            </Popover.Close>
          </div>

          <div className={styles.dpMonthYearRow}>
            <select className={styles.dpSelect} value={month.getMonth()} onChange={(e) => setMonth(new Date(month.getFullYear(), Number(e.target.value), 1))}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className={styles.dpSelect} value={month.getFullYear()} onChange={(e) => setMonth(new Date(Number(e.target.value), month.getMonth(), 1))}>
              {Array.from({ length: 36 }, (_, i) => 2000 + i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <DayPicker
            mode="single"
            selected={value}
            month={month}
            onMonthChange={setMonth}
            onSelect={(d) => d && onChange(d)}
            showOutsideDays
            weekStartsOn={1}
            classNames={{
              root: styles.rdpRoot,
              months: styles.rdpMonths,
              month: styles.rdpMonth,
              month_caption: styles.rdpCaption,
              nav: styles.rdpNav,
              weeks: styles.rdpWeeks,
              weekdays: styles.rdpHeadRow,
              weekday: styles.rdpHeadCell,
              week: styles.rdpRow,
              day: styles.rdpCell,
              day_button: styles.rdpDay,
              selected: styles.rdpDaySelected,
              today: styles.rdpDayToday,
              outside: styles.rdpDayOutside,
              disabled: styles.rdpDayDisabled,
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CalendarHeader
// ─────────────────────────────────────────────────────────────────────────────

interface HeaderProps {
  currentDate: Date;
  selectedDate: Date;
  view: ViewType;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onViewChange: (v: ViewType) => void;
  onDatePickerChange: (d: Date) => void;
}

export function CalendarHeader({
  currentDate,
  selectedDate,
  view,
  onToday,
  onPrevious,
  onNext,
  onViewChange,
  onDatePickerChange,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.leftControls}>
        <button type="button" className={styles.todayButton} onClick={onToday}>
          Today
        </button>
        <div className={styles.navButtons}>
          <button type="button" className={styles.navButton} aria-label="Previous period" onClick={onPrevious}>
            <span aria-hidden="true">&lt;</span>
          </button>
          <button type="button" className={styles.navButton} aria-label="Next period" onClick={onNext}>
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
      </div>

      <div className={styles.centerControls}>
        <h2 className={styles.monthTitle}>{formatMonthYear(currentDate)}</h2>
      </div>

      <div className={styles.rightControls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>View</span>
          <select className={styles.controlField} value={view} onChange={(e) => onViewChange(e.target.value as ViewType)}>
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Date</span>
          <CalendarDatePicker value={selectedDate} onChange={onDatePickerChange} className={styles.controlField} />
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileViewSwitcher — tab bar, visible only on mobile
// ─────────────────────────────────────────────────────────────────────────────

interface MobileViewSwitcherProps {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
}

export function MobileViewSwitcher({ view, onViewChange }: MobileViewSwitcherProps) {
  return (
    <div className={styles.mobileViewSwitcher}>
      {(["Day", "2Day", "Month"] as ViewType[]).map((v) => (
        <button
          key={v}
          type="button"
          className={`${styles.viewSwitcherTab} ${view === v ? styles.viewSwitcherTabActive : ""}`}
          onClick={() => onViewChange(v)}
        >
          {v === "2Day" ? "2 Days" : v}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileHeader — month title + prev/next/today, visible only on mobile
// ─────────────────────────────────────────────────────────────────────────────

interface MobileHeaderProps {
  currentDate: Date;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function MobileHeader({ currentDate, onToday, onPrevious, onNext }: MobileHeaderProps) {
  return (
    <div className={styles.mobileHeader}>
      <button type="button" className={styles.mobileNavBtn} onClick={onPrevious} aria-label="Previous">
        ‹
      </button>
      <button type="button" className={styles.mobileTodayBtn} onClick={onToday}>
        Today
      </button>
      <h2 className={styles.mobileMonthTitle}>{formatMonthYear(currentDate)}</h2>
      <button type="button" className={styles.mobileNavBtn} onClick={onNext} aria-label="Next">
        ›
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileFAB — floating "+" button, mobile-only, opens event creation directly
// ─────────────────────────────────────────────────────────────────────────────

interface MobileFABProps {
  /** Called with the currently-viewed date and the next round hour as defaults */
  onPress: (date: Date, startHour: number, endHour: number) => void;
  /** The date currently visible in the calendar (used to pre-fill the modal) */
  currentDate: Date;
}

export function MobileFAB({ onPress, currentDate }: MobileFABProps) {
  const handleTap = () => {
    // Default to the next round hour, capped at 23:00–23:59
    const now = new Date();
    const isSameDate =
      now.getDate() === currentDate.getDate() &&
      now.getMonth() === currentDate.getMonth() &&
      now.getFullYear() === currentDate.getFullYear();

    const startHour = isSameDate
      ? Math.min(now.getHours() + 1, 23)   // next hour from now
      : 9;                                   // 9 AM for future/past dates

    const endHour = Math.min(startHour + 1, 24);

    onPress(currentDate, startHour, endHour);
  };

  return (
    <button
      type="button"
      className={styles.mobileFAB}
      onClick={handleTap}
      aria-label="Create new event"
    >
      <span aria-hidden="true">+</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MonthView
// ─────────────────────────────────────────────────────────────────────────────

interface MonthViewProps {
  today: Date;
  weekDayItems: WeekDayItem[];
  monthGridDays: MonthDayItem[];
  events: CalendarEvent[];
  importedEvents: ImportedCalendarEvent[];
  onEventClick: (evt: CalendarEvent) => void;
  onEventDelete: (id: string) => void;
  onImportedEventClick: (evt: ImportedCalendarEvent) => void;
  /** IDs of events involved in a conflict — used to show a ⚠️ indicator. */
  conflictEventIds?: Set<string>;
}

export function MonthView({
  today,
  weekDayItems,
  monthGridDays,
  events,
  importedEvents,
  onEventClick,
  onEventDelete,
  onImportedEventClick,
  conflictEventIds = new Set(),
}: MonthViewProps) {
  const getEventsForDay     = (date: Date) => events.filter((e) => isSameDay(e.date, date));
  const getImportedEventsForDay = (date: Date) => importedEvents.filter((e) => isSameDay(e.date, date));

  return (
    <div className={styles.monthWrapper}>
      <div className={styles.monthWeekdays}>
        {weekDayItems.map((item) => (
          <div key={item.label} className={styles.monthWeekday}>{item.label}</div>
        ))}
      </div>

      <div className={styles.monthGrid}>
        {monthGridDays.map((item, index) => {
          const isToday    = isSameDay(item.date, today);
          const dayEvents  = getEventsForDay(item.date);
          const dayImported = getImportedEventsForDay(item.date);
          const allChips = [
            ...dayEvents.map((e) => ({ kind: "own" as const, e })),
            ...dayImported.map((e) => ({ kind: "imported" as const, e })),
          ];
          const visibleChips = allChips.slice(0, 3);
          const hiddenCount  = allChips.length - visibleChips.length;

          return (
            <div
              key={`${item.date.toDateString()}-${index}`}
              className={item.isCurrentMonth ? styles.monthCell : `${styles.monthCell} ${styles.monthCellMuted}`}
              role="gridcell"
              aria-label={item.date.toDateString()}
            >
              <span className={isToday ? styles.monthDayNumberToday : styles.monthDayNumber}>
                {getDayNumber(item.date)}
              </span>

              {visibleChips.map((chip) =>
                chip.kind === "own" ? (
                  <div
                    key={chip.e.id}
                    className={`${styles.monthEventChip} ${conflictEventIds.has(String(chip.e.id)) ? styles.chipConflict : ""}`}
                    style={{ background: chip.e.color }}
                    title={`${chip.e.title} (${formatDecimalHour12(chip.e.startHour)} – ${formatDecimalHour12(chip.e.endHour)})${conflictEventIds.has(String(chip.e.id)) ? " ⚠️ Schedule conflict" : ""}`}
                    onClick={() => onEventClick(chip.e)}
                  >
                    {conflictEventIds.has(String(chip.e.id)) && (
                      <span className={styles.chipConflictIcon} aria-label="Schedule conflict">⚠️</span>
                    )}
                    <span className={styles.monthChipText}>{chip.e.title}</span>
                    <button
                      type="button"
                      className={styles.monthChipDelete}
                      onClick={(ev) => { ev.stopPropagation(); onEventDelete(chip.e.id); }}
                      aria-label={`Delete ${chip.e.title}`}
                    >
                      <img src={deleteIcon} alt="Delete" className={styles.monthChipDeleteIcon} />
                    </button>
                  </div>
                ) : (
                  <div
                    key={chip.e.id}
                    className={`${styles.monthImportedChip} ${conflictEventIds.has(`imported-${chip.e.id}`) ? styles.chipConflict : ""}`}
                    style={{ borderColor: chip.e.color }}
                    title={`${chip.e.title} (${formatDecimalHour12(chip.e.startHour)} – ${formatDecimalHour12(chip.e.endHour)}) · ${chip.e.calendarName}${conflictEventIds.has(`imported-${chip.e.id}`) ? " ⚠️ Schedule conflict" : ""}`}
                    onClick={() => onImportedEventClick(chip.e)}
                  >
                    {conflictEventIds.has(`imported-${chip.e.id}`) && (
                      <span className={styles.chipConflictIcon} aria-label="Schedule conflict">⚠️</span>
                    )}
                    <span className={styles.monthImportedDot} style={{ background: chip.e.color }} />
                    <span className={styles.monthChipText}>{chip.e.title}</span>
                  </div>
                ),
              )}

              {hiddenCount > 0 && (
                <div className={styles.monthEventMore}>+{hiddenCount} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TimeGrid  (Day + Week)
// ─────────────────────────────────────────────────────────────────────────────

const TIME_COLUMN_WIDTH = 48;
const ROW_HEIGHT = 60;

interface TimeGridProps {
  isDayView: boolean;
  is2DayView: boolean;
  currentDate: Date;
  today: Date;
  weekDayItems: WeekDayItem[];
  events: CalendarEvent[];
  importedEvents: ImportedCalendarEvent[];
  onEventClick: (evt: CalendarEvent) => void;
  onEventDelete: (id: string) => void;
  onViewLocation?: (evt: CalendarEvent) => void;
  onImportedEventClick: (evt: ImportedCalendarEvent) => void;
  isDragging: boolean;
  dragMinHour: number | null;
  dragMaxHour: number | null;
  dragDayIndex: number | null;
  onSlotMouseDown: (dayDate: Date, dayIdx: number, clientY: number) => void;
  modalOpen: boolean;
  modalDayIndex: number | null;
  modalStartHour: number;
  modalEndHour: number;
  showTimeIndicator: boolean;
  timeIndicatorTop: number;
  timeIndicatorLeft: string;
  timeIndicatorWidth: string;
  gridBodyRef: React.RefObject<HTMLDivElement | null>;
  /** IDs of events involved in a conflict — used to apply the red ring. */
  conflictEventIds?: Set<string>;
  /**
   * Mobile only — called when the FAB "+" is tapped.
   * The parent should open the event creation modal with the supplied defaults.
   */
  onMobileFABPress?: (date: Date, startHour: number, endHour: number) => void;
}

export function TimeGrid({
  isDayView,
  is2DayView,
  currentDate,
  today,
  weekDayItems,
  events,
  importedEvents,
  onEventClick,
  onEventDelete,
  onViewLocation,
  onImportedEventClick,
  isDragging,
  dragMinHour,
  dragMaxHour,
  dragDayIndex,
  onSlotMouseDown,
  modalOpen,
  modalDayIndex,
  modalStartHour,
  modalEndHour,
  showTimeIndicator,
  timeIndicatorTop,
  timeIndicatorLeft,
  timeIndicatorWidth,
  gridBodyRef,
  conflictEventIds = new Set(),
  onMobileFABPress,
}: TimeGridProps) {
  const timeSlots = buildTimeSlots();
  const numCols = isDayView ? 1 : is2DayView ? 2 : 7;

  // Forecast days and city name received from WeatherWidget once weather loads.
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [forecastCity, setForecastCity] = useState<string>("");

  const getEventsForDay         = (date: Date) => events.filter((e) => isSameDay(e.date, date));
  const getImportedEventsForDay = (date: Date) => importedEvents.filter((e) => isSameDay(e.date, date));

  // ── Column header ──
  const renderHeader = () => {
    if (isDayView) {
      const isToday = isSameDay(currentDate, today);
      const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0);
      const itemMidnight  = new Date(currentDate); itemMidnight.setHours(0, 0, 0, 0);
      const daysAhead = Math.round((itemMidnight.getTime() - todayMidnight.getTime()) / 86400000);
      const forecastForDay = (daysAhead >= 1 && daysAhead <= 3) ? forecast[daysAhead - 1] : undefined;
      return (
        <div className={styles.gridHeaderDay}>
          <div className={styles.gridHeaderSpacer} />
          <div className={styles.dayHeaderCellSingle}>
            <span className={isToday ? styles.dayLabelToday : styles.dayLabel}>{formatWeekday(currentDate)}</span>
            {isToday && (
              <div className={styles.dayHeaderWeather}>
                <WeatherWidget onForecastLoad={({ forecast: f, city: c }) => { setForecast(f); setForecastCity(c); }} />
              </div>
            )}
            {forecastForDay && (
              <div className={styles.dayHeaderWeather}>
                <WeatherForecastPill day={forecastForDay} city={forecastCity} />
              </div>
            )}
            <span className={isToday ? styles.dayNumberToday : styles.dayNumber}>{getDayNumber(currentDate)}</span>
          </div>
        </div>
      );
    }

    // Both Week and 2Day use the multi-column header — weekDayItems contains
    // either 7 items (Week) or 2 items (2Day) depending on what the parent passes.
    return (
      <div className={is2DayView ? styles.gridHeader2Day : styles.gridHeader}>
        <div className={styles.gridHeaderSpacer} />
        {weekDayItems.map((item) => {
          const isToday = isSameDay(item.date, today);
          const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0);
          const itemMidnight  = new Date(item.date); itemMidnight.setHours(0, 0, 0, 0);
          const daysAhead = Math.round((itemMidnight.getTime() - todayMidnight.getTime()) / 86400000);
          const forecastForDay = (daysAhead >= 1 && daysAhead <= 3) ? forecast[daysAhead - 1] : undefined;
          return (
            <div key={item.label + item.date.toDateString()} className={styles.dayHeaderCell}>
              <span className={isToday ? styles.dayLabelToday : styles.dayLabel}>{item.label}</span>
              {isToday && (
                <div className={styles.dayHeaderWeather}>
                  <WeatherWidget onForecastLoad={({ forecast: f, city: c }) => { setForecast(f); setForecastCity(c); }} />
                </div>
              )}
              {forecastForDay && (
                <div className={styles.dayHeaderWeather}>
                  <WeatherForecastPill day={forecastForDay} city={forecastCity} />
                </div>
              )}
              <span className={isToday ? styles.dayNumberToday : styles.dayNumber}>{getDayNumber(item.date)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Drag + modal overlay ──
  const renderDragOverlay = () => {
    let min: number | null = null;
    let max: number | null = null;
    let dayIdx: number | null = null;

    if (isDragging && dragMinHour !== null && dragMaxHour !== null && dragDayIndex !== null) {
      min = dragMinHour; max = dragMaxHour; dayIdx = dragDayIndex;
    } else if (modalOpen && modalDayIndex !== null) {
      min = modalStartHour; max = modalEndHour; dayIdx = modalDayIndex;
    }

    if (min === null || max === null || dayIdx === null) return null;

    const top    = min * ROW_HEIGHT;
    const height = (max - min) * ROW_HEIGHT;
    const leftCalc = isDayView
      ? `${TIME_COLUMN_WIDTH}px`
      : `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${dayIdx} / ${numCols})`;
    const widthCalc = isDayView
      ? `calc(100% - ${TIME_COLUMN_WIDTH}px)`
      : `calc((100% - ${TIME_COLUMN_WIDTH}px) / ${numCols})`;

    return (
      <div
        className={styles.dragOverlay}
        style={{ top: `${top}px`, left: leftCalc, width: widthCalc, height: `${height}px` }}
      />
    );
  };

  // ── Own event blocks ──
  const renderEventsForColumn = (dayDate: Date, colIndex: number) => {
    const dayEvents = getEventsForDay(dayDate);
    if (!dayEvents.length) return null;

    return dayEvents.map((evt) => {
      const gap      = 2;
      const top      = evt.startHour * ROW_HEIGHT + gap;
      const height   = (evt.endHour - evt.startHour) * ROW_HEIGHT - gap * 2;
      const isCompact = height < 35;
      const hasConflict = conflictEventIds.has(String(evt.id));

      const leftCalc = isDayView
        ? `${TIME_COLUMN_WIDTH}px`
        : `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${colIndex} / ${numCols} + 2px)`;
      const widthCalc = isDayView
        ? `calc(100% - ${TIME_COLUMN_WIDTH}px - 4px)`
        : `calc((100% - ${TIME_COLUMN_WIDTH}px) / ${numCols} - 4px)`;

      return (
        <div
          key={evt.id}
          className={`${styles.eventBlock} ${isCompact ? styles.eventBlockCompact : ""} ${hasConflict ? styles.eventBlockConflict : ""}`}
          style={{
            top: `${top}px`,
            left: leftCalc,
            width: widthCalc,
            height: `${height}px`,
            background: evt.color,
          }}
          title={`${evt.title}\n${formatDecimalHour12(evt.startHour)} – ${formatDecimalHour12(evt.endHour)}${hasConflict ? "\n⚠️ Schedule conflict" : ""}`}
          onClick={() => onEventClick(evt)}
        >
          <button
            type="button"
            className={styles.eventDeleteBtn}
            onClick={(e) => { e.stopPropagation(); onEventDelete(evt.id); }}
            aria-label={`Delete ${evt.title}`}
          >
            <img src={deleteIcon} alt="Delete" className={styles.eventDeleteIcon} />
          </button>
          {hasConflict && (
            <span className={styles.eventBlockConflictIcon} aria-label="Schedule conflict">⚠️</span>
          )}
          <span className={styles.eventBlockTitle}>{evt.title}</span>
          {!isCompact && (
            <span className={styles.eventBlockTime}>
              {formatDecimalHour12(evt.startHour)} – {formatDecimalHour12(evt.endHour)}
            </span>
          )}
          {isCompact && (
            <span className={styles.eventBlockTimeInline}>{formatDecimalHour12(evt.startHour)}</span>
          )}
          {!isCompact && evt.location?.trim() && onViewLocation && (
            <span
              className={styles.eventBlockLocation}
              onClick={(e) => { e.stopPropagation(); onViewLocation(evt); }}
              title={`${evt.location} — click to open map`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: "inline", marginRight: "4px", verticalAlign: "middle"}}>
                <path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" />
                <path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" />
                <path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" />
              </svg>
              {evt.location}
            </span>
          )}
        </div>
      );
    });
  };

  // ── Imported event blocks ──
  const renderImportedEventsForColumn = (dayDate: Date, colIndex: number) => {
    const dayImported = getImportedEventsForDay(dayDate);
    if (!dayImported.length) return null;

    return dayImported.map((evt) => {
      const gap      = 2;
      const top      = evt.startHour * ROW_HEIGHT + gap;
      const height   = (evt.endHour - evt.startHour) * ROW_HEIGHT - gap * 2;
      const isCompact = height < 35;
      // Imported event IDs are prefixed with "imported-" in UnifiedEvent
      const hasConflict = conflictEventIds.has(`imported-${evt.id}`);

      const leftCalc = isDayView
        ? `${TIME_COLUMN_WIDTH}px`
        : `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${colIndex} / ${numCols} + 2px)`;
      const widthCalc = isDayView
        ? `calc(100% - ${TIME_COLUMN_WIDTH}px - 4px)`
        : `calc((100% - ${TIME_COLUMN_WIDTH}px) / ${numCols} - 4px)`;

      const effectiveLocation = evt.locationOverride ?? evt.location ?? "";

      return (
        <div
          key={`imported-${evt.id}`}
          className={`${styles.importedEventBlock} ${isCompact ? styles.eventBlockCompact : ""} ${hasConflict ? styles.eventBlockConflict : ""}`}
          style={{
            top: `${top}px`,
            left: leftCalc,
            width: widthCalc,
            height: `${height}px`,
            borderLeftColor: evt.color,
          }}
          title={`${evt.title}\n${formatDecimalHour12(evt.startHour)} – ${formatDecimalHour12(evt.endHour)}\n${evt.calendarName}${hasConflict ? "\n⚠️ Schedule conflict" : ""}`}
          onClick={() => onImportedEventClick(evt)}
        >
          <span className={styles.importedEventBadge}>{evt.source === "google" ? "G" : "M"}</span>
          {hasConflict && (
            <span className={styles.eventBlockConflictIcon} aria-label="Schedule conflict">⚠️</span>
          )}
          <span className={styles.eventBlockTitle}>{evt.title}</span>
          {!isCompact && (
            <span className={styles.eventBlockTime}>
              {formatDecimalHour12(evt.startHour)} – {formatDecimalHour12(evt.endHour)}
            </span>
          )}
          {isCompact && (
            <span className={styles.eventBlockTimeInline}>{formatDecimalHour12(evt.startHour)}</span>
          )}
          {!isCompact && effectiveLocation.trim() && (
            <span className={styles.eventBlockLocation}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: "inline", marginRight: "4px", verticalAlign: "middle"}}>
                <path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" />
                <path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" />
                <path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" />
              </svg>
              {effectiveLocation}
            </span>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {renderHeader()}

      <div className={styles.gridBody} ref={gridBodyRef}>
        <div className={`${styles.gridContent} ${isDragging ? styles.gridContentDragging : ""}`}>
          {timeSlots.map((slot, slotIndex) => (
            <div key={slot} className={isDayView ? styles.timeRowDay : is2DayView ? styles.timeRow2Day : styles.timeRow}>
              <div className={styles.timeCell}>{slot}</div>
              {isDayView ? (
                <div
                  className={`${styles.dayCell} ${styles.dayCellSingle}`}
                  role="gridcell"
                  aria-label={`${formatWeekday(currentDate)} ${getDayNumber(currentDate)} ${slot}`}
                  onMouseDown={(e) => { e.preventDefault(); onSlotMouseDown(currentDate, 0, e.clientY); }}
                  onTouchEnd={(e) => {
                    if (e.cancelable) e.preventDefault();
                    const t = e.changedTouches[0];
                    if (t) onSlotMouseDown(currentDate, 0, t.clientY);
                  }}
                />
              ) : (
                weekDayItems.map((item, dayIndex) => (
                  <div
                    key={`${slotIndex}-${dayIndex}`}
                    className={styles.dayCell}
                    role="gridcell"
                    aria-label={`${item.label} ${getDayNumber(item.date)} ${slot}`}
                    onMouseDown={(e) => { e.preventDefault(); onSlotMouseDown(item.date, dayIndex, e.clientY); }}
                    onTouchEnd={(e) => {
                      if (e.cancelable) e.preventDefault();
                      const t = e.changedTouches[0];
                      if (t) onSlotMouseDown(item.date, dayIndex, t.clientY);
                    }}
                  />
                ))
              )}
            </div>
          ))}

          {renderDragOverlay()}

          {isDayView
            ? renderEventsForColumn(currentDate, 0)
            : weekDayItems.map((item, idx) => (
                <React.Fragment key={item.label}>
                  {renderEventsForColumn(item.date, idx)}
                </React.Fragment>
              ))}

          {isDayView
            ? renderImportedEventsForColumn(currentDate, 0)
            : weekDayItems.map((item, idx) => (
                <React.Fragment key={`imported-${item.label}`}>
                  {renderImportedEventsForColumn(item.date, idx)}
                </React.Fragment>
              ))}

          {showTimeIndicator && (
            <div
              className={styles.timeIndicator}
              style={{ top: `${timeIndicatorTop}px`, left: timeIndicatorLeft, width: timeIndicatorWidth }}
            >
              <span className={styles.timeIndicatorDot} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB — replaces drag-to-create on touch devices */}
      {onMobileFABPress && (
        <MobileFAB
          currentDate={currentDate}
          onPress={onMobileFABPress}
        />
      )}
    </>
  );
}