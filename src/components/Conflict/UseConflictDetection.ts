/*  
*  FILE          : UseConflictDetection.ts 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Custom hook that detects schedule conflicts across all event sources (own, Google, Microsoft).
*/ 

import { useState, useEffect, useCallback, useMemo } from "react";
import type { UnifiedEvent, ConflictWarning, ConflictKind } from "./ConflictType";

// ── Pure synchronous detector ─────────────────────────────────────────────────
function detectConflicts(events: UnifiedEvent[]): ConflictWarning[] {
  const sorted = [...events].sort((a, b) => a.startHour - b.startHour);
  const results: ConflictWarning[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (a.startHour === 0 && a.endHour <= 1) continue; // skip all-day

    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (b.startHour === 0 && b.endHour <= 1) continue; // skip all-day

      if (b.startHour > a.endHour + 0.25) break;

      const gapMins = Math.round((b.startHour - a.endHour) * 60);
      const id = `${a.id}__${b.id}`;
      if (seen.has(id)) continue;
      seen.add(id);

      let kind: ConflictKind;
      if (gapMins < 0) {
        kind = "overlap";
      } else if (gapMins <= 15) {
        kind = "tight";
      } else {
        continue;
      }

      results.push({
        id,
        kind,
        eventA: a,
        eventB: b,
        gapMins,
        dismissed: false,
      });
    }
  }

  return results;
}

// ── The hook ──────────────────────────────────────────────────────────────────

interface UseConflictDetectionResult {
  visibleWarnings: ConflictWarning[];
  conflictEventIds: Set<string>;
  handleDismiss: (id: string) => void;
  handleSnooze: (id: string, durationMs?: number) => void;
}

export function useConflictDetection(
  dayEvents: UnifiedEvent[],
): UseConflictDetectionResult {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [snoozedMap, setSnoozedMap] = useState<Map<string, number>>(new Map());
  const [tick, setTick] = useState(0);

  // Tick once per minute to expire snoozes
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Core detection — only reruns when event list changes
  const allWarnings = useMemo(
    () => detectConflicts(dayEvents),
    [dayEvents],
  );

  // Prune dismissed/snoozed entries for warnings that no longer exist
  useEffect(() => {
    const existingIds = new Set(allWarnings.map((w) => w.id));

    setDismissedIds((prev) => {
      const next = new Set([...prev].filter((id) => existingIds.has(id)));
      return next.size === prev.size ? prev : next;
    });

    setSnoozedMap((prev) => {
      const next = new Map([...prev].filter(([id]) => existingIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [allWarnings]);

  // Visibility filter
  const visibleWarnings = useMemo(() => {
    const now_ms = Date.now();
    void tick; // force re-eval when tick changes

    return allWarnings.filter((w) => {
      if (dismissedIds.has(w.id)) return false;
      const snoozedUntil = snoozedMap.get(w.id);
      if (snoozedUntil !== undefined && now_ms < snoozedUntil) return false;
      return true;
    });
  }, [allWarnings, dismissedIds, snoozedMap, tick]);

  const conflictEventIds = useMemo(
    () => new Set(visibleWarnings.flatMap((w) => [w.eventA.id, w.eventB.id])),
    [visibleWarnings],
  );

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  const handleSnooze = useCallback((id: string, durationMs = 60 * 60 * 1000) => {
    setSnoozedMap((prev) => new Map([...prev, [id, Date.now() + durationMs]]));
  }, []);

  return { visibleWarnings, conflictEventIds, handleDismiss, handleSnooze };
}