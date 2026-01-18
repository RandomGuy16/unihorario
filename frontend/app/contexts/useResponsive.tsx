"use client"
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface ResponsiveContextType {
  isMobile: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined)


interface ResponsiveContextProps {
  children: ReactNode
}
export function ResponsiveContextProvider({ children }: ResponsiveContextProps ) {
  // initial check
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px')  // <768 for mobile

    // due to next's hydration problems
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(mediaQuery.matches)

    // initialize a listener for changes
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mediaQuery.addEventListener('change', handleChange)

    // cleanup
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <ResponsiveContext.Provider value={{isMobile}}>
      {children}
    </ResponsiveContext.Provider>
  )
}

export function useResponsive() {
  const context = useContext(ResponsiveContext)
  if (context ===undefined) {
    throw new Error('useResponsive must be used within a ResponsiveContextProvider')
  }
  return context
}
