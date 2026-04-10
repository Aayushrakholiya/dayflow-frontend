/*  
*  FILE          : MainPage.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Main authenticated page orchestrating calendar, sidebar, location panel, and event management.
*/ 

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import UpcomingEventsSidebar from "../components/UpcomingEventsSidebar/UpcomingEventsSidebar";
import MainCalendarView from "../components/MainCalendarView/MainCalendarView";
import LocationPanel from "../components/LocationPanel/LocationPanel";
import type { CalendarEvent } from "../components/EventCreationModel/EventCreationModel";
import type { ImportedCalendarEvent } from "../components/MainCalendarView/CalendarImportService";
import { markEventCompleted } from "../api";
import { useLocationPermission } from "../components/LocationServices/useLocationPermission";
import { useFCMInitializer } from "../hooks/useFCMInitializer";
import styles from "./main.module.css";

export default function MainPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [importedEvents, setImportedEvents] = useState<ImportedCalendarEvent[]>([]);
  const [locationEvent, setLocationEvent] = useState<CalendarEvent | null>(null);

  // ── Mobile: toggle the upcoming-events sheet ──────────────────────────────
  const [upcomingOpen, setUpcomingOpen] = useState(false);

  const reloadImportedRef = useRef<(() => void) | null>(null);
  const openForEditRef = useRef<((e: CalendarEvent) => void) | null>(null);

  const {
    state: locState,
    coords: userCoords,
    request: requestLocation,
  } = useLocationPermission();

  const handleViewLocation = useCallback((e: CalendarEvent) => {
    setLocationEvent(e);
  }, []);

  // Initialize Firebase Cloud Messaging for push notifications
  const userId = localStorage.getItem("userId");
  useFCMInitializer(userId);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the upcoming sheet when tapping outside it on mobile
  const handleOverlayClick = useCallback(() => {
    setUpcomingOpen(false);
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

       {/* ✅ ONLY ONE SIDEBAR */}
  <Sidebar
    onCalendarSyncComplete={() => reloadImportedRef.current?.()}
    onToggleUpcoming={() => setUpcomingOpen((v) => !v)}
    upcomingOpen={upcomingOpen}
  />

  {/* ✅ THIS IS THE REAL FIX */}
  <div className={styles.sidebarSpacer} />

  {/* Overlay */}
  {upcomingOpen && (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,16,8,0.35)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        zIndex: 1100,
      }}
    />
  )}

      {/* Dim overlay behind the upcoming sheet on mobile */}
      {upcomingOpen && (
        <div
          onClick={handleOverlayClick}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,16,8,0.35)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            zIndex: 1100,
          }}
        />
      )}
    
      <UpcomingEventsSidebar
        events={events}
        importedEvents={importedEvents}
        onEventCompleted={handleEventCompleted}
        onViewLocation={handleViewLocation}
        onOpenEventForEdit={(e) => openForEditRef.current?.(e)}
        // Pass the open state so the sidebar can apply .sidebarOpen on mobile
        mobileOpen={upcomingOpen}
        onClose={() => setUpcomingOpen(false)}
      />

      <main
        className={`${styles.main} ${bannerVisible ? styles.mainWithBanner : ""}`}
      >
        <MainCalendarView
          onEventsChange={setEvents}
          onImportedEventsChange={setImportedEvents}
          onRegisterReloadImported={(fn) => {
            reloadImportedRef.current = fn;
          }}
          onRegisterOpenForEdit={(fn) => {
            openForEditRef.current = fn;
          }}
          userCoords={userCoords}
        />
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