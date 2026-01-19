"use client"
import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {StylesConfig} from "react-select";


interface ThemeContextType {
  theme: 'light' | 'dark' | null;
  toggleTheme: () => void;
  getReactSelectStyles: () => StylesConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeContextProvider({children} : {children: ReactNode}) {
  // manage dark and light theme colors
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  // Initialize theme and setup system theme listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
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

  // toggle theme, idk when am I going to use this
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const readVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const getReactSelectStyles = (): StylesConfig => {
    const surface = `rgb(${readVar("--color-surface")})`;
    const border = `rgb(${readVar("--color-border")})`;
    const surfaceMuted = `rgb(${readVar("--color-surface-muted")})`;
    const text = `rgb(${readVar("--color-foreground")})`;
    const accent = `rgb(${readVar("--color-accent")})`;
    const fontSize = readVar("--text-control") || "0.8125rem";

    return {
      control: (base, state) => ({
        ...base,
        backgroundColor: surface,
        border: `1px solid ${border}`,
        boxShadow: state.isFocused ? `0 0 0 1px ${accent}` : "none",
        color: text,
        fontSize: fontSize,
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: surface,
        zIndex: 9999,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? surfaceMuted : "transparent",
        color: text,
        cursor: "pointer",
        fontSize: fontSize,
      }),
      singleValue: (base) => ({ ...base, color: text }),
      input: (base) => ({ ...base, color: text }),
      indicatorSeparator: () => ({ display: "none" }),
      dropdownIndicator: (base) => ({ ...base, color: accent }),
    };
  };

  return (
    <ThemeContext.Provider value={{theme, toggleTheme, getReactSelectStyles}}>
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
