import type { CalendarEvent } from "./components/EventCreationModel/EventCreationModel";

export interface Task {
  id?: string | number;
  title: string;
  dueDate: Date;
  startHour: number;
  endHour: number;
  durationMinutes: number;
  color?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ===== EVENTS API =====
export async function createEvent(event: CalendarEvent, userId: string) {
  const res = await fetch(`${API_URL}/api/events/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify({
      title: event.title,
      date: event.date.toISOString(),
      startHour: event.startHour,
      endHour: event.endHour,
      attendees: event.attendees || [],
      location: event.location || null,
      description: event.description || null,
      videoconferencing: event.videoconferencing || null,
      color: event.color || null,
      userId,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || "Failed to create event");
  }
  return res.json();
}

export async function getEvents(userId: string) {
  const res = await fetch(`${API_URL}/api/events?userId=${userId}`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function updateEvent(
  id: string,
  event: CalendarEvent,
  userId: string,
) {
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify({
      title: event.title,
      date: event.date.toISOString(),
      startHour: event.startHour,
      endHour: event.endHour,
      attendees: event.attendees || [],
      location: event.location || null,
      description: event.description || null,
      videoconferencing: event.videoconferencing || null,
      color: event.color || null,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || "Failed to update event");
  }
  return res.json();
}

export async function deleteEvent(id: string, userId: string) {
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to delete event");
  return res.json();
}

// ===== TASKS API =====
export async function createTask(task: Task, userId: string) {
  const res = await fetch(`${API_URL}/api/tasks/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify({
      ...task,
      dueDate: task.dueDate.toISOString(),
      userId,
    }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function getTasks(userId: string) {
  const res = await fetch(`${API_URL}/api/tasks?userId=${userId}`, {
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function updateTask(id: string, task: Task, userId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-user-id": userId },
    body: JSON.stringify({
      ...task,
      dueDate: task.dueDate.toISOString(),
    }),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(id: string, userId: string) {
  const res = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
}
export async function markEventCompleted(eventId: string): Promise<void> {
  await fetch(`${API_URL}/api/events/${eventId}/complete`, { method: "PATCH" });
}
