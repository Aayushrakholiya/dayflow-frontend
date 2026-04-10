/*  
*  FILE          : ConflictType.ts 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Type definitions for unified events and conflict warnings.
*/ 
export interface UnifiedEvent {
  id:            string;
  title:         string;
  date:          Date;
  startHour:     number;  // decimal, e.g. 9.5 = 9:30 AM
  endHour:       number;
  location:      string;
  color:         string;
  kind:          "event" | "task" | "imported";
  source?:       "google" | "microsoft";
  calendarName?: string;
}

/** The two kinds of scheduling problems we surface to the user. */
export type ConflictKind = "overlap" | "tight";

export interface ConflictWarning {
  /** Stable key built from `${eventA.id}__${eventB.id}` — safe to persist. */
  id:            string;
  kind:          ConflictKind;
  eventA:        UnifiedEvent;
  eventB:        UnifiedEvent;
  /** Negative = overlap in minutes; 0-15 = tight gap. */
  gapMins:       number;
  dismissed:     boolean;
  /** epoch ms — warning is hidden until this time. */
  snoozedUntil?: number;
}