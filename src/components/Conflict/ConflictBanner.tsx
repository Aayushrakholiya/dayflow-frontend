/*  
*  FILE          : ConflictBanner.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Displays schedule conflict warnings with options to dismiss, snooze, or resolve conflicts.
*/ 

import { useState } from "react";
import styles from "./ConflictBanner.module.css";
import type { ConflictWarning, UnifiedEvent } from "./ConflictType";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ConflictBannerProps {
  warnings:  ConflictWarning[];
  onDismiss: (id: string) => void;
  onSnooze:  (id: string) => void;
  /** Opens the given own-calendar event in EDIT mode. */
  onEdit?:   (event: UnifiedEvent) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sourceLabel(event: UnifiedEvent): string {
  if (event.kind !== "imported") return "Your calendar";
  if (event.source === "google")
    return event.calendarName ? `Google · ${event.calendarName}` : "Google Calendar";
  if (event.source === "microsoft")
    return event.calendarName ? `Outlook · ${event.calendarName}` : "Outlook Calendar";
  return "Imported";
}

function buildMessage(w: ConflictWarning): string {
  const a = `"${w.eventA.title}"`;
  const b = `"${w.eventB.title}"`;
  switch (w.kind) {
    case "overlap":
      return `${a} and ${b} overlap by ${Math.abs(w.gapMins)} min`;
    case "tight":
      return w.gapMins === 0
        ? `${a} ends exactly when ${b} starts`
        : `Only ${w.gapMins} min between ${a} and ${b}`;
  }
}

// ── Single row ────────────────────────────────────────────────────────────────

function WarningRow({
  warning,
  onDismiss,
  onSnooze,
  onEdit,
}: {
  warning:   ConflictWarning;
  onDismiss: (id: string) => void;
  onSnooze:  (id: string) => void;
  onEdit?:   (event: UnifiedEvent) => void;
}) {
  const { kind, eventA, eventB } = warning;

  const icon = kind === "overlap" ? "⚠️" : "⏱️";

  const rowClass = kind === "overlap" ? styles.rowOverlap : styles.rowTight;

  const sourceA = sourceLabel(eventA);
  const sourceB = sourceLabel(eventB);
  const showSources = sourceA !== sourceB;

  // Both events in the pair are shown as editable if they are own events.
  // Imported events cannot be edited — we just show their name.
  const editableA = eventA.kind !== "imported" ? eventA : null;
  const editableB = eventB.kind !== "imported" ? eventB : null;

  return (
    <div className={`${styles.warningRow} ${rowClass}`} role="alert">
      <span className={styles.icon} aria-hidden="true">{icon}</span>

      <div className={styles.body}>
        <p className={styles.message}>{buildMessage(warning)}</p>

        {showSources && (
          <p className={styles.sources}>{sourceA} → {sourceB}</p>
        )}

        <div className={styles.actions}>
          {/* Show an Edit button for each own-calendar event in the pair */}
          {editableA && onEdit && (
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => onEdit(editableA)}
              title={`Edit "${eventA.title}"`}
            >
              Edit "{eventA.title}"
            </button>
          )}
          {editableB && onEdit && editableB.id !== editableA?.id && (
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => onEdit(editableB)}
              title={`Edit "${eventB.title}"`}
            >
              Edit "{eventB.title}"
            </button>
          )}
          <button
            type="button"
            className={styles.snoozeBtn}
            onClick={() => onSnooze(warning.id)}
            title="Hide for 1 hour"
          >
            Snooze 1h
          </button>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={() => onDismiss(warning.id)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Floating panel ────────────────────────────────────────────────────────────

export function ConflictPanel({ warnings, onDismiss, onSnooze, onEdit }: ConflictBannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!warnings.length) return null;

  return (
    <div className={styles.floatingPanel} role="region" aria-label="Schedule conflicts">
      {/* ── Header bar ── */}
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          ⚠️ {warnings.length} schedule conflict{warnings.length > 1 ? "s" : ""}
        </span>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand conflicts" : "Collapse conflicts"}
        >
          {collapsed ? "▾" : "▴"}
        </button>
      </div>

      {/* ── Warning rows ── */}
      {!collapsed && (
        <div className={styles.panelBody}>
          {warnings.map((w) => (
            <WarningRow
              key={w.id}
              warning={w}
              onDismiss={onDismiss}
              onSnooze={onSnooze}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Keep the old named export so DailySummary doesn't need changes
export { ConflictPanel as ConflictBanner };