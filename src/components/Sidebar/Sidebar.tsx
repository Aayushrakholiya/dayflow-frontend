/*  
*  FILE          : Sidebar.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Sidebar with profile, settings, help, about options and calendar connection panel.
*/ 

import { useState, useEffect, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import CalendarConnectPanel from "../MainCalendarView/CalendarConnectPanel";
import styles from "./Sidebar.module.css";
import { useNavigate } from "react-router-dom";

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.5 10.5C15.5 8.567 13.933 7 12 7C10.067 7 8.5 8.567 8.5 10.5C8.5 12.433 10.067 14 12 14C13.933 14 15.5 12.433 15.5 10.5Z" />
    <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" />
    <path d="M18 20C18 16.6863 15.3137 14 12 14C8.68629 14 6 16.6863 6 20" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.71534 14.1842 2.38533 13.9228 2.19657C13.6615 2.00781 13.3143 2.00781 12.6199 2.00781H11.5051C10.8108 2.00781 10.4636 2.00781 10.2022 2.19657C9.94085 2.38533 9.83106 2.71534 9.61149 3.37536L9.27753 4.37274C9.12465 4.77133 8.84845 5.11043 8.48937 5.34042L8.15249 5.53479C7.73374 5.74994 7.25259 5.80994 6.79398 5.70418L5.57375 5.36048C4.85541 5.15664 4.49625 5.05472 4.17867 5.18388C3.86109 5.31305 3.67445 5.63696 3.30115 6.28479L2.80757 7.14139C2.45766 7.74864 2.2827 8.05227 2.31666 8.37549C2.35061 8.69871 2.58483 8.95918 3.05326 9.48012L4.0843 10.6328C4.3363 10.9518 4.51521 11.5078 4.51521 12.0077C4.51521 12.5078 4.33636 13.0636 4.08433 13.3827L3.05326 14.5354C2.58483 15.0564 2.35062 15.3168 2.31666 15.6401C2.2827 15.9633 2.45766 16.2669 2.80757 16.8741L3.30114 17.7307C3.67443 18.3785 3.86109 18.7025 4.17867 18.8316C4.49625 18.9608 4.85542 18.8589 5.57377 18.655L6.79394 18.3113C7.25263 18.2055 7.73387 18.2656 8.15267 18.4808L8.4895 18.6752C8.84851 18.9052 9.12464 19.2442 9.2775 19.6428L9.61149 20.6403C9.83106 21.3003 9.94085 21.6303 10.2022 21.8191C10.4636 22.0078 10.8108 22.0078 11.5051 22.0078H12.6199C13.3143 22.0078 13.6615 22.0078 13.9228 21.8191C14.1842 21.6303 14.294 21.3003 14.5136 20.6403L14.8476 19.6428C15.0004 19.2442 15.2765 18.9052 15.6356 18.6752L15.9724 18.4808C16.3912 18.2656 16.8724 18.2055 17.3311 18.3113L18.5513 18.655C19.2696 18.8589 19.6288 18.9608 19.9464 18.8316C20.264 18.7025 20.4506 18.3785 20.8239 17.7307L21.3175 16.8741C21.6674 16.2669 21.8423 15.9633 21.8084 15.6401C21.7744 15.3168 21.5402 15.0564 21.0718 14.5354L20.0407 13.3827C19.7887 13.0636 19.6098 12.5078 19.6098 12.0077C19.6098 11.5078 19.7888 10.9518 20.0407 10.6328L21.0718 9.48012C21.5402 8.95918 21.7744 8.69871 21.8084 8.37549C21.8423 8.05227 21.6674 7.74864 21.3175 7.14139Z" />
    <path d="M15.5195 12C15.5195 13.933 13.9525 15.5 12.0195 15.5C10.0865 15.5 8.51953 13.933 8.51953 12C8.51953 10.067 10.0865 8.5 12.0195 8.5C13.9525 8.5 15.5195 10.067 15.5195 12Z" />
  </svg>
);

const HelpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.5 9.5C9.5 8.11929 10.6193 7 12 7C13.3807 7 14.5 8.11929 14.5 9.5C14.5 10.3569 14.0689 11.1131 13.4117 11.5636C12.7283 12.0319 12 12.6716 12 13.5" />
    <path d="M12.125 16.75H12M12.25 16.75C12.25 16.8881 12.1381 17 12 17C11.8619 17 11.75 16.8881 11.75 16.75C11.75 16.6119 11.8619 16.5 12 16.5C12.1381 16.5 12.25 16.6119 12.25 16.75Z" />
  </svg>
);

const AboutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" />
    <path d="M12 8V12" />
    <path d="M12.125 15.75H12M12.25 15.75C12.25 15.8881 12.1381 16 12 16C11.8619 16 11.75 15.8881 11.75 15.75C11.75 15.6119 11.8619 15.5 12 15.5C12.1381 15.5 12.25 15.6119 12.25 15.75Z" />
  </svg>
);

interface SidebarProps {
  onCalendarSyncComplete?: () => void;
  onToggleUpcoming?: () => void;
  upcomingOpen?: boolean;
}

export default function Sidebar({ onCalendarSyncComplete, onToggleUpcoming, upcomingOpen = false }: SidebarProps) {
  const [fullName] = useState<string>(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "";
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.href = "/login";
        return "";
      }
      return decoded?.fullName ?? "";
    } catch {
      return "";
    }
  });

  const [email] = useState<string>(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "";
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.href = "/login";
        return "";
      }
      return decoded?.email ?? "";
    } catch {
      return "";
    }
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  }

  const avatarLetter = fullName ? fullName.charAt(0).toUpperCase() : "?";
  const userId = localStorage.getItem("userId") ?? "";

  const menuItems = [
    { icon: ProfileIcon, label: "Profile & Account" },
    { icon: SettingsIcon, label: "Settings" },
    { icon: HelpIcon, label: "Help & Support" },
    { icon: AboutIcon, label: "About" },
  ];

  return (
    <aside className={styles.sidebar} aria-label="Sidebar">
      {/* Avatar + dropdown */}
      <div className={styles.top} ref={menuRef}>
        <button
          type="button"
          className={styles.avatarButton}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={`Open menu for ${fullName || "user"}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className={styles.avatar}>{avatarLetter}</span>
        </button>

        {menuOpen && (
          <div className={styles.menu} role="menu">
            <div className={styles.menuHeader}>
              <span className={styles.menuAvatarLarge}>{avatarLetter}</span>
              <div className={styles.menuUserInfo}>
                <span className={styles.menuFullName}>
                  {fullName || "User"}
                </span>
                <span className={styles.menuSubtext}>
                  {email || "Signed in"}
                </span>
              </div>
            </div>
            <div className={styles.menuDivider} />
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);

                  if (item.label === "Help & Support") {
                    navigate("/help");
                  }

                  if (item.label === "About") {
                    navigate("/about");
                  }
                }}
              >
                <span className={styles.menuItemIcon}>
                  {typeof item.icon === "function" ? <item.icon /> : item.icon}
                </span>
                <span className={styles.menuItemLabel}>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Middle section: nav icons ── */}
      <div className={styles.middle}>
        <Popover.Root open={calendarOpen} onOpenChange={setCalendarOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={`${styles.navIconBtn} ${calendarOpen ? styles.navIconBtnActive : ""}`}
              aria-label="Connected Calendars"
              title="Connected Calendars"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
              </svg>
              <span className={styles.navIconLabel}>Calendars</span>
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="right"
              sideOffset={14}
              align="start"
              avoidCollisions={true}
              collisionPadding={12}
              className={styles.calendarPopoverContent}
            >
              <CalendarConnectPanel
                userId={userId}
                onSyncComplete={() => {
                  onCalendarSyncComplete?.();
                  setCalendarOpen(false);
                }}
                onClose={() => setCalendarOpen(false)}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Agenda / Upcoming Events toggle — mobile only */}
        <button
          type="button"
          className={`${styles.navIconBtn} ${styles.agendaBtn} ${upcomingOpen ? styles.navIconBtnSheetOpen : ""}`}
          aria-label="Upcoming Events"
          title="Upcoming Events"
          aria-pressed={upcomingOpen}
          onClick={onToggleUpcoming}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" />
            <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span className={styles.navIconLabel}>Agenda</span>
        </button>
      </div>

      {/* Logout */}
      <div className={styles.bottom}>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          aria-label="Log out"
        >
          <svg
            className={styles.logoutIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className={styles.logoutLabel}>Logout</span>
        </button>
      </div>
    </aside>
  );
}