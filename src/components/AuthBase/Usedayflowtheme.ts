/*  
*  FILE          : Usedayflowtheme.ts 
*  PROJECT       : PROG3221 - capstone
*  PROGRAMMER    : Ayushkumar Rakholiya, Jal Shah, Darsh Patel and Virajsinh Solanki 
*  FIRST VERSION : 2026-02-01 
*  DESCRIPTION   : 
*    Custom hook for reading and switching the app theme globally.
*/ 

import { useContext } from "react";
import { ThemeContext, type IThemeContext } from "./ThemeContext";

export function useDayflowTheme(): IThemeContext {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useDayflowTheme must be used inside ThemeContextProvider");
  return ctx;
}