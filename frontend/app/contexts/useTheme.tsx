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

  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme')

    const initialTheme = savedTheme as ('light' | 'dark') || (isDark ? 'dark' : 'light')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme)
  }, []);

  useEffect(() => {
    if (!theme) return

    const root = window.document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const getReactSelectStyles = (): StylesConfig => {
    const isDark = theme == 'dark';

    return {
      control: (baseStyles, state) => ({
        ...baseStyles,
        backgroundColor: isDark ? "#404040" : "#ffffff",
        border: `1px solid ${isDark ? "transparent" : "#d1d5db"}`,
        boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
        color: isDark ? "white" : "#1f2937",
        "&:hover": {
          borderColor: isDark ? "rgb(90, 90, 90)" : "#9ca3af",
        },
      }),

      menu: (baseStyles) => ({
        ...baseStyles,
        backgroundColor: isDark ? "#303030" : "#ffffff",
        boxShadow: isDark
          ? "0 4px 8px rgba(0, 0, 0, 0.3)"
          : "0 4px 8px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
      }),

      option: (baseStyles, state) => ({
        ...baseStyles,
        backgroundColor: state.isFocused
          ? (isDark ? "#4b5563" : "#f3f4f6")
          : "transparent",
        color: isDark ? "white" : "#1f2937",
        cursor: "pointer",
      }),

      singleValue: (baseStyles) => ({
        ...baseStyles,
        color: isDark ? "white" : "#1f2937",
      }),

      input: (baseStyles) => ({
        ...baseStyles,
        color: isDark ? "white" : "#1f2937",
      }),

      // Keep these minimal useful ones
      indicatorSeparator: () => ({display: "none"}),

      dropdownIndicator: (baseStyles) => ({
        ...baseStyles,
        color: "#3b82f6",
      }),
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

