import { useCallback, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import UpcomingEventsSidebar from "../components/UpcomingEventsSidebar/UpcomingEventsSidebar";
import MainCalendarView from "../components/MainCalendarView/MainCalendarView";
import LocationPanel from "../components/LocationPanel/LocationPanel";
import type { CalendarEvent } from "../components/EventCreationModel/EventCreationModel";
import { markEventCompleted } from "../api";
import { useLocationPermission } from "../components/LocationServices/useLocationPermission";
import styles from "./main.module.css";

export default function MainPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [locationEvent, setLocationEvent] = useState<CalendarEvent | null>(
    null,
  );

  const {
    state: locState,
    coords: userCoords,
    request: requestLocation,
  } = useLocationPermission();

  const handleViewLocation = useCallback((e: CalendarEvent) => {
    setLocationEvent(e);
  }, []);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEventCompleted = useCallback((eventId: string) => {
    markEventCompleted(eventId).catch(console.error);
  }, []);

  const bannerVisible = locState === "denied";

  return (
    <div className={styles.root}>
      {bannerVisible && (
        <div className={styles.permissionBanner}>
          <span className={styles.permissionBannerText}>
            📍 Location access denied — ETA and directions won't work.
          </span>
          <button
            className={styles.permissionBannerBtn}
            onClick={requestLocation}
          >
            Enable
          </button>
        </div>
      )}

      <Sidebar />

      <UpcomingEventsSidebar
        events={events}
        onEventCompleted={handleEventCompleted}
        onViewLocation={handleViewLocation}
      />

      <main
        className={`${styles.main} ${bannerVisible ? styles.mainWithBanner : ""}`}
      >
        <MainCalendarView onEventsChange={setEvents} userCoords={userCoords} />
      </main>

      {locationEvent && (
        <div
          className={styles.locationBackdrop}
          onClick={() => setLocationEvent(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <LocationPanel
              event={locationEvent}
              onClose={() => setLocationEvent(null)}
              userCoords={userCoords}
            />
          </div>
        </div>
      )}
    </div>
  );
}
