<div align="center">

# ⚛️ DayFlow — Frontend

**The React 19 + Vite client for [DayFlow](https://github.com/Aayushrakholiya/Dayflow_capstone), the smart calendar that makes your day easy.**

> This is the **frontend deployment repo** — the API lives at [dayflow-backend](https://github.com/Aayushrakholiya/dayflow-backend), and the complete monorepo source lives at [Dayflow_capstone](https://github.com/Aayushrakholiya/Dayflow_capstone).

<br>

[![▶️ Demo Video](https://img.shields.io/badge/▶️_Demo_Video-Watch_on_YouTube-FF0000?style=for-the-badge&labelColor=1a1a2e)](https://youtu.be/wx2OzbUkqes)

<br>

![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-007FFF?style=flat-square&logo=mui&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet_Maps-199900?style=flat-square&logo=leaflet&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_FCM-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## 📌 Table of Contents

- [About](#-about)
- [What This Repo Is](#-what-this-repo-is)
- [UI Overview](#-ui-overview)
- [Getting Started](#-getting-started)

## 👋 About

DayFlow is a smart calendar web app that brings events, tasks, location, weather, and notifications into one system. This repo builds the interface users actually touch: a polished calendar experience with Material UI components, an interactive map for location picking, and Firebase push notifications delivered right in the browser.

## 📦 What This Repo Is

The full application was originally one codebase ([Dayflow_capstone](https://github.com/Aayushrakholiya/Dayflow_capstone)). Deploying it as a single unit proved impractical, so the frontend and backend were **split into standalone repos and deployed separately to Vercel** — and it works exactly as intended.

- This repo = **frontend only**, configured for Vercel with SPA rewrites (`vercel.json` routes everything to `index.html`)
- Talks to the backend API deployed from [dayflow-backend](https://github.com/Aayushrakholiya/dayflow-backend)
- Kept in sync with the monorepo source

## 🖥️ UI Overview

| Area | Components |
| --- | --- |
| **Auth** | Signup, Login, Forgot Password (with polished auth screens) |
| **Calendar** | `MainCalendarView` — day/week/month views of all events |
| **Event management** | `EventCreationModel`, conflict checker (`Conflict`), `DailySummary` |
| **Upcoming** | `UpcomingEventsSidebar` so tomorrow is always visible |
| **Location** | `LocationPanel` + `LocationServices` with interactive map (Leaflet / Google Maps) |
| **Weather** | `WeatherWidget` — the forecast where your events happen |
| **Notifications** | `fcmNotificationService` — Firebase Cloud Messaging push in-browser |
| **Navigation** | `Sidebar` + `AppLayout` shell, plus About & Help pages |

## 🚀 Getting Started

```bash
git clone https://github.com/Aayushrakholiya/dayflow-frontend.git
cd dayflow-frontend
npm install
npm run dev       # Vite dev server
npm run build     # type-check + production build
```

Point the API base URL at your backend (local or the deployed one) and you're in.

---

<div align="center">

⭐ **Star this repo if you find it useful** ⭐

</div>
