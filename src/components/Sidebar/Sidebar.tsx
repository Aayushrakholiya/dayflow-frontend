import { useState, useEffect, useRef } from "react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {

  // this will read the JWT from localStorage and decode the fullName from its payload.
  const [fullName] = useState<string>(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return "";
      }
      const decoded = JSON.parse(atob(token.split(".")[1]));
      // If the token is expired then it will clear the storage and send the user to login
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        globalThis.location.href = "/login";
        return "";
      }
      return decoded?.fullName ?? "";
    } catch {
      return "";
    }
  });

  // it is same as above but reads the email field from the token payload
  const [email] = useState<string>(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return "";
      }
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        globalThis.location.href = "/login";
        return "";
      }
      return decoded?.email ?? "";
    } catch {
      return "";
    }
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // this will close the dropdown menu when the user clicks anywhere outside it
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [menuOpen]);

  // this will clear the token and redirect to the login page
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    globalThis.location.href = "/login";
  }

  // this will show the first letter of the user's name, or "?" if it is not loaded 
  const avatarLetter = fullName ? fullName.charAt(0).toUpperCase() : "?";

  const menuItems = [
    { icon: "👤", label: "Profile & Account" },
    { icon: "⚙️", label: "Settings" },
    { icon: "💬", label: "Help & Support" },
    { icon: "ℹ️", label: "About" },
  ];

  return (
    <aside className={styles.sidebar} aria-label="Sidebar">

      {/* Avatar button and dropdown menu at the top */}
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

            {/* User info shown at the top of the dropdown */}
            <div className={styles.menuHeader}>
              <span className={styles.menuAvatarLarge}>{avatarLetter}</span>
              <div className={styles.menuUserInfo}>
                <span className={styles.menuFullName}>{fullName || "User"}</span>
                <span className={styles.menuSubtext}>{email || "Signed in"}</span>
              </div>
            </div>

            <div className={styles.menuDivider} />

            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <span className={styles.menuItemIcon}>{item.icon}</span>
                <span className={styles.menuItemLabel}>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Logout button pinned to the bottom */}
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