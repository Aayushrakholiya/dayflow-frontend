// @refresh reset
// AuthBaseLayout.tsx
// Default export: AuthBaseLayout (layout component)
// Named export:   ThemeContextProvider (provider component)
//
// IMPORTANT: ThemeContextProvider must wrap your entire app in App.tsx.
// AuthBaseLayout must be rendered inside ThemeContextProvider to receive
// theme updates from the toggle button.

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

import Dayflow from "../../assets/Dayflow.png";
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
    text:       { primary: "#111827", secondary: "#6b7280" },
    divider:    "#e5e7eb",
  },
  shape:      { borderRadius: 6 },
  typography: { fontFamily: "-apple-system, 'Segoe UI', sans-serif" },
});

const makeDarkTheme = () => createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#f97316", dark: "#ea580c", light: "#fdba74", contrastText: "#ffffff" },
    background: { default: "#111827", paper: "#1f2937" },
    text:       { primary: "#f9fafb", secondary: "#9ca3af" },
    divider:    "#374151",
  },
  shape:      { borderRadius: 6 },
  typography: { fontFamily: "-apple-system, 'Segoe UI', sans-serif" },
});

// Provider — renders its own ThemeProvider so MUI components inside
// the app respond immediately when themeMode changes.
export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<IThemeMode>(loadPreference);
  const prefersDark               = useMediaQuery("(prefers-color-scheme: dark)");

  const muiTheme = useMemo(() => {
    switch (themeMode) {
      case IThemeMode.Light:  return makeLightTheme();
      case IThemeMode.Dark:   return makeDarkTheme();
      case IThemeMode.System:
      default:                return prefersDark ? makeDarkTheme() : makeLightTheme();
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
  { mode: IThemeMode.Light,  label: "Light",  Icon: LightMode          },
  { mode: IThemeMode.Dark,   label: "Dark",   Icon: DarkMode           },
  { mode: IThemeMode.System, label: "System", Icon: SettingsBrightness },
];

type LayoutProps = {
  title:     string;
  subtitle?: string;
  children:  ReactNode;
};

export default function AuthBaseLayout({ title, subtitle, children }: LayoutProps) {
  const muiTheme        = useTheme();
  const ctx             = useContext(ThemeContext);
  const themeMode       = ctx?.themeMode ?? IThemeMode.System;
  const switchThemeMode = ctx?.switchThemeMode ?? (() => {});

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen                = Boolean(anchorEl);

  const handleOpen   = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose  = () => setAnchorEl(null);
  const handleSwitch = (mode: IThemeMode) => { switchThemeMode(mode); handleClose(); };

  const CurrentIcon =
    themeMode === IThemeMode.Dark   ? DarkMode           :
    themeMode === IThemeMode.System ? SettingsBrightness :
                                      LightMode;

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <img src={Dayflow} alt="Dayflow Logo" className={styles.logoImage} />
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
              position:     "absolute",
              top:          20,
              right:        20,
              border:       `1px solid ${muiTheme.palette.divider}`,
              borderRadius: `${muiTheme.shape.borderRadius}px`,
              color:        muiTheme.palette.text.secondary,
              "&:hover": {
                borderColor:     muiTheme.palette.primary.main,
                color:           muiTheme.palette.primary.main,
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
          transformOrigin={{ vertical: "top",    horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt:           1,
                minWidth:     140,
                borderRadius: `${muiTheme.shape.borderRadius}px`,
                border:       `1px solid ${muiTheme.palette.divider}`,
                boxShadow:    muiTheme.shadows[4],
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
                  color:           muiTheme.palette.primary.main,
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