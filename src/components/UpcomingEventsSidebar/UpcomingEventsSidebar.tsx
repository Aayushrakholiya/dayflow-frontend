/*  
*  FILE          : UpcomingEventsSidebar.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Sidebar displaying upcoming calendar events with daily summary and event interactions.
*/ 

import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";
import type { ImportedCalendarEvent } from "../MainCalendarView/CalendarImportService";
import { DailySummary } from "../DailySummary/DailySummary";
import styles from "./UpcomingEventsSidebar.module.css";

interface Props {
  events: CalendarEvent[];
  importedEvents?: ImportedCalendarEvent[];
  onOpenEvent?: (e: CalendarEvent) => void;
  onOpenEventForEdit?: (e: CalendarEvent) => void;
  onViewLocation?: (e: CalendarEvent) => void;
  onEventCompleted?: (eventId: string) => void;
  /** Mobile only — when true the sheet slides up into view */
  mobileOpen?: boolean;
  /** Mobile only — called when the user taps ✕ to close the sheet */
  onClose?: () => void;
}

export default function UpcomingEventsSidebar({
  events,
  importedEvents,
  onOpenEvent,
  onOpenEventForEdit,
  onViewLocation,
  onEventCompleted,
  mobileOpen = false,
  onClose,
}: Props) {
  return (
    <section
      className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
      aria-label="Daily summary"
    >
      <DailySummary
        events={events}
        importedEvents={importedEvents}
        onOpenEvent={onOpenEvent}
        onOpenEventForEdit={onOpenEventForEdit}
        onViewLocation={onViewLocation}
        onEventCompleted={onEventCompleted}
        onClose={onClose}
      />
    </section>
  );
}