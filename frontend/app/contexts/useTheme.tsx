"use client"
import { useState, useEffect, createContext, useContext, ReactNode } from "react";


interface ThemeContextType {
  theme: 'light' | 'dark' | null;
  toggleTheme: () => void;
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

  return (
    <ThemeContext.Provider value={{theme, toggleTheme}}>
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
