"use client"
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { StylesConfig } from "react-select";

interface ThemeContextType {
  theme: 'light' | 'dark' | null;
  toggleTheme: () => void;
  getReactSelectStyles: () => StylesConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  // manage dark and light theme colors
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)
  const [styles, setStyles] = useState<StylesConfig | null>(null)

  // Initialize theme and setup system theme listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    const initialTheme = savedTheme as ('light' | 'dark') || (mediaQuery.matches ? 'dark' : 'light')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme)

    // Listen for system theme changes
    const handleThemeChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
    }
    mediaQuery.addEventListener('change', handleThemeChange)
    return () => mediaQuery.removeEventListener('change', handleThemeChange)
  }, []);

  // Apply theme to DOM and save to localStorage
  useEffect(() => {
    if (!theme) return

    const root = window.document.documentElement

    if (theme === 'dark') root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')

    localStorage.setItem('theme', theme)
  }, [theme])

  // Leer variables CSS después del render del cliente
  useEffect(() => {
    const readVar = (name: string) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim() || "";

    const newStyles: StylesConfig = {
      control: (base, state) => ({
        ...base,
        backgroundColor: `rgb(${readVar("--color-surface")})`,
        border: `1px solid rgb(${readVar("--color-border")})`,
        boxShadow: state.isFocused ? `0 0 0 1px rgb(${readVar("--color-accent")})` : "none",
        color: `rgb(${readVar("--color-foreground")})`,
        fontSize: readVar("--text-control") || "0.8125rem",
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: `rgb(${readVar("--color-surface")})`,
        zIndex: 9999,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? `rgb(${readVar("--color-surface-muted")})` : "transparent",
        color: `rgb(${readVar("--color-foreground")})`,
        cursor: "pointer",
        fontSize: readVar("--text-control") || "0.8125rem",
      }),
      singleValue: (base) => ({ ...base, color: `rgb(${readVar("--color-foreground")})` }),
      input: (base) => ({ ...base, color: `rgb(${readVar("--color-foreground")})` }),
      indicatorSeparator: () => ({ display: "none" }),
      dropdownIndicator: (base) => ({ ...base, color: `rgb(${readVar("--color-accent")})` }),
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStyles(newStyles);

    // Re-leer si cambia el tema
    const observer = new MutationObserver(() => setStyles({ ...newStyles }));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const getReactSelectStyles = (): StylesConfig => styles || {};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, getReactSelectStyles }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
}
