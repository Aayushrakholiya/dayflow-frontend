// Describes a single feature card shown in the Features section
export interface Feature {
  icon: string;
  title: string;
  description: string;
}

// Describes a single event shown inside the hero app preview card
export interface PreviewEvent {
  time: string;
  title: string;
  meta: string;
}

// Links rendered in the navbar and the label is the display text, href is the scroll target
export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Help", href: "#help" },
];

// the below are the sample events displayed in the hero card 
export const previewEvents: PreviewEvent[] = [
  {
    time: "9:00 AM",
    title: "Team Standup",
    meta: "📍 Office · 12 min drive",
  },
  {
    time: "12:30 PM",
    title: "Grocery Run",
    meta: "🌤️ 4°C · Leave by 12:10",
  },
  {
    time: "3:00 PM",
    title: "Doctor Appointment",
    meta: "⚠️ Conflict with 2:45 PM",
  },
];

export const features: Feature[] = [
  {
    icon: "🔔",
    title: "Smart Leave-By Notifications",
    description: "Never be late again. Dayflow tells you exactly when to leave based on real-time conditions — not just when the event starts.",
  },
  {
    icon: "📍",
    title: "Location-Based Travel Time",
    description: "Know how long it actually takes to get there. We factor in your current location, traffic, and route — automatically.",
  },
  {
    icon: "⚠️",
    title: "Smart Conflict Warnings",
    description: "Dayflow catches scheduling conflicts before they happen and warns you in advance so you can plan smarter.",
  },
  {
    icon: "🔍",
    title: "Conflict Detection",
    description: "Overlapping events? Double-bookings? Dayflow detects them instantly and surfaces the issue clearly.",
  },
  {
    icon: "🌤️",
    title: "Weather Integration",
    description: "Check the weather for any event without switching apps. Dayflow pulls in live forecasts right inside your schedule.",
  },
  {
    icon: "📋",
    title: "Daily Schedule Summary",
    description: "Start every morning with a clear, at-a-glance overview of your day — everything you need, all in one place.",
  },
];