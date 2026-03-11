// useDayflowTheme.ts
// Hook to read and switch the app theme. Import from here anywhere in the app.
//   import { useDayflowTheme } from "../AuthBase/useDayflowTheme"

import { useContext } from "react";
import { ThemeContext, type IThemeContext } from "./ThemeContext";

export function useDayflowTheme(): IThemeContext {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useDayflowTheme must be used inside ThemeContextProvider");
  return ctx;
}