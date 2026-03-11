
import { createContext } from "react";

export const IThemeMode = {
  Light:  "light",
  Dark:   "dark",
  System: "system",
} as const;

export type IThemeMode = (typeof IThemeMode)[keyof typeof IThemeMode];

export interface IThemeContext {
  themeMode:       IThemeMode;
  switchThemeMode: (mode: IThemeMode) => void;
}

export const ThemeContext = createContext<IThemeContext | null>(null);

export const STORAGE_KEY = "dayflow-theme";

export const savePreference = (mode: IThemeMode) =>
  localStorage.setItem(STORAGE_KEY, mode);

export const loadPreference = (): IThemeMode => {
  const saved = localStorage.getItem(STORAGE_KEY) as IThemeMode | null;
  const valid = Object.values(IThemeMode) as IThemeMode[];
  return saved && valid.includes(saved) ? saved : IThemeMode.System;
};