// CalendarViews.tsx — all sub-components for MainCalendarView.
// CalendarDatePicker · CalendarHeader · MonthView · TimeGrid
// Zero inline styles — everything is in calendar.module.css.

import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";
import type {
  ViewType,
  WeekDayItem,
  MonthDayItem,
} from "./CalendarUtils";
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
import WeatherWidget from "../WeatherWidget/WeatherWidget";

// ─────────────────────────────────────────────────────────────────────────────
// CalendarDatePicker
// ─────────────────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value:      Date;
  onChange:   (d: Date) => void;
  className?: string;
}

export function CalendarDatePicker({ value, onChange, className }: DatePickerProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={`${className} ${styles.datePickerTrigger}`}>
          {value.toLocaleDateString("en-CA")}
          <span aria-hidden="true">📅</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content sideOffset={12} align="end" className={styles.datePickerContent}>
          <div className={styles.datePickerTopBar}>
            <button
              type="button"
              className={styles.datePickerTodayBtn}
              onClick={() => onChange(new Date())}
            >
              Today
            </button>
            <Popover.Close asChild>
              <button type="button" className={styles.datePickerCloseBtn}>✕</button>
            </Popover.Close>
          </div>

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
              root:          { "--rdp-cell-size": "34px" } as React.CSSProperties,
              caption_label: { fontSize: "16px", fontWeight: 800, color: "#1f2937" },
              head_cell:     { fontWeight: 700, color: "#6b7280" },
              day:           { borderRadius: 12, fontWeight: 600 },
              day_selected:  { backgroundColor: "rgba(255,106,61,0.16)", outline: "2px solid #ff6a3d", outlineOffset: "-2px", color: "#111827" },
              day_today:     { outline: "2px solid rgba(255,106,61,0.45)", outlineOffset: "-2px" },
              dropdown:      { border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10, padding: "6px 10px", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", fontWeight: 700, cursor: "pointer" },
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
  currentDate:        Date;
  selectedDate:       Date;
  view:               ViewType;
  onToday:            () => void;
  onPrevious:         () => void;
  onNext:             () => void;
  onViewChange:       (v: ViewType) => void;
  onDatePickerChange: (d: Date) => void;
}

export function CalendarHeader({
  currentDate, selectedDate, view,
  onToday, onPrevious, onNext, onViewChange, onDatePickerChange,
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
        <h2 className={styles.monthTitle}>{formatMonthYear(currentDate)}</h2>
      </div>

      <div className={styles.rightControls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>View</span>
          <select
            className={styles.controlField}
            value={view}
            onChange={(e) => onViewChange(e.target.value as ViewType)}
          >
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Date</span>
          <CalendarDatePicker
            value={selectedDate}
            onChange={onDatePickerChange}
            className={styles.controlField}
          />
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Weather</span>
          <WeatherWidget />
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MonthView
// ─────────────────────────────────────────────────────────────────────────────

interface MonthViewProps {
  today:         Date;
  weekDayItems:  WeekDayItem[];
  monthGridDays: MonthDayItem[];
  events:        CalendarEvent[];
  onEventClick:  (evt: CalendarEvent) => void;
  onEventDelete: (id: string) => void;
}

export function MonthView({
  today, weekDayItems, monthGridDays, events, onEventClick, onEventDelete,
}: MonthViewProps) {
  const getEventsForDay = (date: Date) => events.filter((e) => isSameDay(e.date, date));

  return (
    <div className={styles.monthWrapper}>
      <div className={styles.monthWeekdays}>
        {weekDayItems.map((item) => (
          <div key={item.label} className={styles.monthWeekday}>{item.label}</div>
        ))}
      </div>

      <div className={styles.monthGrid}>
        {monthGridDays.map((item, index) => {
          const isToday   = isSameDay(item.date, today);
          const dayEvents = getEventsForDay(item.date);
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

              {dayEvents.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  className={styles.monthEventChip}
                  style={{ background: evt.color}}
                  title={`${evt.title} (${formatDecimalHour12(evt.startHour)} – ${formatDecimalHour12(evt.endHour)})`}
                  onClick={() => onEventClick(evt)}
                >
                  <span className={styles.monthChipText}>{evt.title}</span>
                  <button
                    type="button"
                    className={styles.monthChipDelete}
                    onClick={(e) => { e.stopPropagation(); onEventDelete(evt.id); }}
                    aria-label={`Delete ${evt.title}`}
                  >
                    <img src={deleteIcon} alt="Delete" className={styles.monthChipDeleteIcon} />
                  </button>
                </div>
              ))}

              {dayEvents.length > 3 && (
                <div className={styles.monthEventMore}>+{dayEvents.length - 3} more</div>
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
const ROW_HEIGHT        = 60;

interface TimeGridProps {
  isDayView:          boolean;
  currentDate:        Date;
  today:              Date;
  weekDayItems:       WeekDayItem[];
  events:             CalendarEvent[];
  onEventClick:       (evt: CalendarEvent) => void;
  onEventDelete:      (id: string) => void;
  onViewLocation?:    (evt: CalendarEvent) => void;
  isDragging:         boolean;
  dragMinHour:        number | null;
  dragMaxHour:        number | null;
  dragDayIndex:       number | null;
  onSlotMouseDown:    (dayDate: Date, dayIdx: number, clientY: number) => void;
  modalOpen:          boolean;
  modalDayIndex:      number | null;
  modalStartHour:     number;
  modalEndHour:       number;
  showTimeIndicator:  boolean;
  timeIndicatorTop:   number;
  timeIndicatorLeft:  string;
  timeIndicatorWidth: string;
  gridBodyRef:        React.RefObject<HTMLDivElement | null>;
}

export function TimeGrid({
  isDayView, currentDate, today, weekDayItems,
  events, onEventClick, onEventDelete, onViewLocation,
  isDragging, dragMinHour, dragMaxHour, dragDayIndex, onSlotMouseDown,
  modalOpen, modalDayIndex, modalStartHour, modalEndHour,
  showTimeIndicator, timeIndicatorTop, timeIndicatorLeft, timeIndicatorWidth,
  gridBodyRef,
}: TimeGridProps) {
  const timeSlots = buildTimeSlots();

  const getEventsForDay = (date: Date) => events.filter((e) => isSameDay(e.date, date));

  // ── Column header ──
  const renderHeader = () => {
    if (isDayView) {
      const isToday = isSameDay(currentDate, today);
      return (
        <div className={styles.gridHeaderDay}>
          <div className={styles.gridHeaderSpacer} />
          <div className={styles.dayHeaderCellSingle}>
            <span className={isToday ? styles.dayLabelToday : styles.dayLabel}>
              {formatWeekday(currentDate)}
            </span>
            <span className={isToday ? styles.dayNumberToday : styles.dayNumber}>
              {getDayNumber(currentDate)}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.gridHeader}>
        <div className={styles.gridHeaderSpacer} />
        {weekDayItems.map((item) => {
          const isToday = isSameDay(item.date, today);
          return (
            <div key={item.label} className={styles.dayHeaderCell}>
              <span className={isToday ? styles.dayLabelToday : styles.dayLabel}>{item.label}</span>
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

    const top      = min * ROW_HEIGHT;
    const height   = (max - min) * ROW_HEIGHT;
    const leftCalc = isDayView
      ? `${TIME_COLUMN_WIDTH}px`
      : `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${dayIdx} / 7)`;
    const widthCalc = isDayView
      ? `calc(100% - ${TIME_COLUMN_WIDTH}px)`
      : `calc((100% - ${TIME_COLUMN_WIDTH}px) / 7)`;

    return (
      <div
        className={styles.dragOverlay}
        style={{ top: `${top}px`, left: leftCalc, width: widthCalc, height: `${height}px` }}
      />
    );
  };

  // ── Positioned event blocks ──
  const renderEventsForColumn = (dayDate: Date, colIndex: number) => {
    const dayEvents = getEventsForDay(dayDate);
    if (!dayEvents.length) return null;

    return dayEvents.map((evt) => {
      const gap       = 2;
      const top       = evt.startHour * ROW_HEIGHT + gap;
      const height    = (evt.endHour - evt.startHour) * ROW_HEIGHT - gap * 2;
      const isCompact = height < 35;

      const leftCalc = isDayView
        ? `${TIME_COLUMN_WIDTH}px`
        : `calc(${TIME_COLUMN_WIDTH}px + (100% - ${TIME_COLUMN_WIDTH}px) * ${colIndex} / 7 + 2px)`;
      const widthCalc = isDayView
        ? `calc(100% - ${TIME_COLUMN_WIDTH}px - 4px)`
        : `calc((100% - ${TIME_COLUMN_WIDTH}px) / 7 - 4px)`;

      return (
        <div
          key={evt.id}
          className={`${styles.eventBlock} ${isCompact ? styles.eventBlockCompact : ""}`}
          style={{ top: `${top}px`, left: leftCalc, width: widthCalc, height: `${height}px`, background: evt.color}}
          title={`${evt.title}\n${formatDecimalHour12(evt.startHour)} – ${formatDecimalHour12(evt.endHour)}`}
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
              title={`📍 ${evt.location} — click to open map`}
            >
              📍 {evt.location}
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
        <div className={styles.gridContent} style={{ cursor: isDragging ? "grabbing" : undefined }}>

          {timeSlots.map((slot, slotIndex) => (
            <div key={slot} className={isDayView ? styles.timeRowDay : styles.timeRow}>
              <div className={styles.timeCell}>{slot}</div>
              {isDayView ? (
                <div
                  className={`${styles.dayCell} ${styles.dayCellSingle}`}
                  role="gridcell"
                  aria-label={`${formatWeekday(currentDate)} ${getDayNumber(currentDate)} ${slot}`}
                  onMouseDown={(e) => { e.preventDefault(); onSlotMouseDown(currentDate, 0, e.clientY); }}
                />
              ) : (
                weekDayItems.map((item, dayIndex) => (
                  <div
                    key={`${slotIndex}-${dayIndex}`}
                    className={styles.dayCell}
                    role="gridcell"
                    aria-label={`${item.label} ${getDayNumber(item.date)} ${slot}`}
                    onMouseDown={(e) => { e.preventDefault(); onSlotMouseDown(item.date, dayIndex, e.clientY); }}
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
    </>
  );
}