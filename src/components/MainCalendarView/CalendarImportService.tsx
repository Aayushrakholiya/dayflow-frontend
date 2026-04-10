/*  
*  FILE          : CalendarImportService.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Service for importing and syncing Google and Microsoft calendar events.
*/ 

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CalendarProvider = "google" | "microsoft";

export interface ImportedCalendarEvent {
  id: number;
  userId: number;
  externalId: string;
  source: CalendarProvider;
  title: string;
  date: Date;
  startHour: number;
  endHour: number;
  location: string | null;
  locationOverride: string | null;
  description: string | null;
  attendees: string[];
  videoconferencing: string | null;
  color: string;
  calendarName: string;
}

// ── Connection status ─────────────────────────────────────────────────────────

export async function getCalendarConnectionStatus(
  userId: string | number,
  provider: CalendarProvider,
): Promise<boolean> {
  try {
    const res  = await fetch(`${API_BASE}/api/${provider}-calendar/status?userId=${userId}`);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.connected;
  } catch {
    return false;
  }
}

// ── OAuth popup ───────────────────────────────────────────────────────────────

const POPUP_MESSAGE_TYPES: Record<CalendarProvider, string> = {
  google:    "GOOGLE_CALENDAR_CONNECTED",
  microsoft: "MICROSOFT_CALENDAR_CONNECTED",
};

export function connectCalendarViaPopup(
  userId: string | number,
  provider: CalendarProvider,
): Promise<void> {
  return fetchAuthUrlAndOpenPopup(userId, provider);
}

async function fetchAuthUrlAndOpenPopup(
  userId: string | number,
  provider: CalendarProvider,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/${provider}-calendar/auth-url?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to get auth URL");
  const { url } = await res.json();

  const popup = window.open(url, `connect_${provider}`, "width=520,height=640,left=200,top=100");

  if (!popup) {
    throw new Error("Popup was blocked — please allow popups for this site.");
  }

  const expectedType = POPUP_MESSAGE_TYPES[provider];

  return new Promise<void>((resolve, reject) => {
    let resolvedByMessage = false;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === expectedType) {
        resolvedByMessage = true;
        window.removeEventListener("message", handler);
        clearInterval(closedPoll);
        resolve();
      }
    };

    window.addEventListener("message", handler);

   
    const closedPoll = setInterval(async () => {
      let isClosed = false;
      try { isClosed = popup.closed; } catch { /* COOP blocked — assume open */ }

      if (isClosed) {
        clearInterval(closedPoll);
        window.removeEventListener("message", handler);

        if (resolvedByMessage) return;

        // Give a 1.5s grace period then verify with the server
        await new Promise((r) => setTimeout(r, 1500));

        if (resolvedByMessage) return;

        try {
          const connected = await getCalendarConnectionStatus(userId, provider);
          if (connected) {
            resolve();
          } else {
            reject(new Error("OAuth popup was closed before completing authorization."));
          }
        } catch {
          reject(new Error("OAuth popup was closed before completing authorization."));
        }
      }
    }, 500);
  });
}

// ── Sync ──────────────────────────────────────────────────────────────────────

export async function syncCalendar(
  userId: string | number,
  provider: CalendarProvider,
): Promise<{ imported: number }> {
  const res = await fetch(`${API_BASE}/api/${provider}-calendar/sync`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Sync failed");
  }
  return res.json();
}

// ── Disconnect ────────────────────────────────────────────────────────────────

export async function disconnectCalendar(
  userId: string | number,
  provider: CalendarProvider,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/${provider}-calendar/disconnect`, {
    method:  "DELETE",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Disconnect failed");
}

// ── Fetch imported events ─────────────────────────────────────────────────────

export async function getImportedEvents(
  userId: string | number,
): Promise<ImportedCalendarEvent[]> {
  const res = await fetch(`${API_BASE}/api/imported-events?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch imported events");
  const data = await res.json();

  return (data.events ?? []).map((ev: ImportedCalendarEvent & { date: string }) => ({
    ...ev,
    date: new Date(ev.date),
  }));
}

// ── Update location override ──────────────────────────────────────────────────

export async function updateImportedEventLocation(
  id: number,
  userId: string | number,
  locationOverride: string | null,
): Promise<ImportedCalendarEvent> {
  const res = await fetch(`${API_BASE}/api/imported-events/${id}/location`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId, locationOverride }),
  });
  if (!res.ok) throw new Error("Failed to update location");
  const data = await res.json();
  return { ...data.event, date: new Date(data.event.date) };
}