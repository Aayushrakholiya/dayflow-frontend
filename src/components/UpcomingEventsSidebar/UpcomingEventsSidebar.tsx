import type { CalendarEvent } from "../EventCreationModel/EventCreationModel";
import { DailySummary } from "../DailySummary/DailySummary";
import styles from "./UpcomingEventsSidebar.module.css";

interface Props {
  events:            CalendarEvent[];
  onOpenEvent?:      (e: CalendarEvent) => void;
  onViewLocation?:   (e: CalendarEvent) => void;
  onEventCompleted?: (eventId: string) => void;
}

export default function UpcomingEventsSidebar({ events, onOpenEvent, onViewLocation, onEventCompleted }: Props) {
  return (
    <section className={styles.sidebar} aria-label="Daily summary">
      <DailySummary
        events={events}
        onOpenEvent={onOpenEvent}
        onViewLocation={onViewLocation}
        onEventCompleted={onEventCompleted}
      />
    </section>
  );
}