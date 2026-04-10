/*  
*  FILE          : AuthBaseLayout.tsx 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    This file defines the AuthBaseLayout component, which serves as a common layout for authentication pages (login, signup, etc.) in the Dayflow application.
*/ 

import {
  useMemo,
  useState,
  useContext,
  type ReactNode,
} from "react";
import {
  Box,
  createTheme,
  IconButton,
  Menu,
  MenuItem,
  ThemeProvider,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  DarkMode,
  LightMode,
  SettingsBrightness,
} from "@mui/icons-material";

//import Dayflow from "../../assets/Dayflow.png";

// Sample events shown in the left panel preview card
const PREVIEW_EVENTS = [
  { time: "9:00 AM", title: "Team Standup", meta: "📍 Office · 12 min drive" },
  { time: "12:30 PM", title: "Grocery Run", meta: "🌤️ 4°C · Leave by 12:10" },
  { time: "3:00 PM", title: "Doctor Appointment", meta: "⚠️ Conflict with 2:45 PM" },
];
import styles from "./AuthBase.module.css";

import {
  IThemeMode,
  ThemeContext,
  savePreference,
  loadPreference,
} from "./ThemeContext";

// Themes defined inside useMemo so palette is always fresh
const makeLightTheme = () => createTheme({
  palette: {
    mode: "light",
    primary: { main: "#f97316", dark: "#ea580c", light: "#fdba74", contrastText: "#ffffff" },
    background: { default: "#f9fafb", paper: "#ffffff" },
    text: { primary: "#111827", secondary: "#6b7280" },
    divider: "#e5e7eb",
  },
  shape: { borderRadius: 6 },
  typography: { fontFamily: "-apple-system, 'Segoe UI', sans-serif" },
});

const makeDarkTheme = () => createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#f97316", dark: "#ea580c", light: "#fdba74", contrastText: "#ffffff" },
    background: { default: "#111827", paper: "#1f2937" },
    text: { primary: "#f9fafb", secondary: "#9ca3af" },
    divider: "#374151",
  },
  shape: { borderRadius: 6 },
  typography: { fontFamily: "-apple-system, 'Segoe UI', sans-serif" },
});

// Provider — renders its own ThemeProvider so MUI components inside
// the app respond immediately when themeMode changes.
export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<IThemeMode>(loadPreference);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const muiTheme = useMemo(() => {
    switch (themeMode) {
      case IThemeMode.Light: return makeLightTheme();
      case IThemeMode.Dark: return makeDarkTheme();
      case IThemeMode.System:
      default: return prefersDark ? makeDarkTheme() : makeLightTheme();
    }
  }, [themeMode, prefersDark]);

  const switchThemeMode = (mode: IThemeMode) => {
    setThemeMode(mode);
    savePreference(mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, switchThemeMode }}>
      <ThemeProvider theme={muiTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

// Layout component
const THEME_OPTIONS: { mode: IThemeMode; label: string; Icon: React.ElementType }[] = [
  { mode: IThemeMode.Light, label: "Light", Icon: LightMode },
  { mode: IThemeMode.Dark, label: "Dark", Icon: DarkMode },
  { mode: IThemeMode.System, label: "System", Icon: SettingsBrightness },
];

type LayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthBaseLayout({ title, subtitle, children }: LayoutProps) {
  const muiTheme = useTheme();
  const ctx = useContext(ThemeContext);
  const themeMode = ctx?.themeMode ?? IThemeMode.System;
  const switchThemeMode = ctx?.switchThemeMode ?? (() => {});

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSwitch = (mode: IThemeMode) => { switchThemeMode(mode); handleClose(); };

  const CurrentIcon =
    themeMode === IThemeMode.Dark ? DarkMode :
    themeMode === IThemeMode.System ? SettingsBrightness :
                                      LightMode;

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        {/* Floating badge — top left */}
        <div className={styles.floatingBadge} style={{ top: "8%", left: "6%" }}>
          ✦ Your life, simplified
        </div>

        {/* Floating badge — bottom right */}
        <div className={styles.floatingBadge} style={{ bottom: "10%", right: "4%" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" style={{display: "inline", marginRight: "4px", verticalAlign: "middle"}}><path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" /><path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" /><path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" /></svg> 12 min drive
        </div>

        {/* Floating badge — top right */}
        <div className={styles.floatingBadge} style={{ top: "8%", right: "4%" }}>
          🔔 Leave by 8:45 AM
        </div>

        {/* Floating badge — bottom left */}
        <div className={styles.floatingBadgeFree} style={{ bottom: "10%", left: "6%" }}>
          ✅ Free forever
        </div>

        {/* Central content */}
        <div className={styles.panelContent}>
          {/* Dayflow wordmark */}
          <div className={styles.wordmark}>
            Dayflow<span className={styles.wordmarkDot}>.</span>
          </div>
          <p className={styles.panelTagline}>Make your day easy.</p>

          {/* App preview card */}
          <div className={styles.previewCard}>
            <div className={styles.previewDots}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
            <p className={styles.previewDate}>TODAY — {new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}</p>

            {PREVIEW_EVENTS.map((ev, i) => (
              <div key={i} className={styles.previewEvent}>
                <span className={styles.previewTime}>{ev.time}</span>
                <div className={styles.previewEventBody}>
                  <span className={styles.previewTitle}>{ev.title}</span>
                  <span className={styles.previewMeta}>{ev.meta}</span>
                </div>
              </div>
            ))}

            <div className={styles.previewFooter}>
              3 events · 2 reminders · 1 conflict
            </div>
          </div>
        </div>
      </div>

      <Box
        className={styles.formSection}
        sx={{ backgroundColor: muiTheme.palette.background.paper }}
      >
        <Tooltip title="Change theme" placement="left">
          <IconButton
            onClick={handleOpen}
            size="small"
            aria-label="Change theme"
            aria-controls={menuOpen ? "theme-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
            sx={{
              position: "absolute",
              top: 20,
              right: 20,
              border: `1px solid ${muiTheme.palette.divider}`,
              borderRadius: `${muiTheme.shape.borderRadius}px`,
              color: muiTheme.palette.text.secondary,
              "&:hover": {
                borderColor: muiTheme.palette.primary.main,
                color: muiTheme.palette.primary.main,
                backgroundColor: muiTheme.palette.action?.hover,
              },
            }}
          >
            <CurrentIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Menu
          id="theme-menu"
          open={menuOpen}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 140,
                borderRadius: `${muiTheme.shape.borderRadius}px`,
                border: `1px solid ${muiTheme.palette.divider}`,
                boxShadow: muiTheme.shadows[4],
              },
            },
          }}
        >
          {THEME_OPTIONS.map(({ mode, label, Icon }) => (
            <MenuItem
              key={mode}
              selected={themeMode === mode}
              onClick={() => handleSwitch(mode)}
              sx={{
                gap: 1.5, fontSize: 14,
                "&.Mui-selected": {
                  color: muiTheme.palette.primary.main,
                  backgroundColor: muiTheme.palette.action?.selected,
                },
              }}
            >
              <Icon fontSize="small" />
              {label}
            </MenuItem>
          ))}
        </Menu>

        <div className={styles.formWrapper}>
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: 700, textAlign: "center", mb: 1, color: muiTheme.palette.text.primary }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              sx={{ textAlign: "center", mb: 3.5, color: muiTheme.palette.text.secondary, lineHeight: 1.5 }}
            >
              {subtitle}
            </Typography>
          )}

          {children}
        </div>
      </Box>
    </div>
  );
}