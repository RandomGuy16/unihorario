"use client"
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useResponsive } from "@/app/providers/useResponsive";


interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

interface SidebarProviderProps {
  children: ReactNode;
}
export function SidebarContextProvider({ children }: SidebarProviderProps) {
  const { isMobile } = useResponsive()
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)

  useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSidebarOpen(false)
    }
  }, [isMobile])

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const openSidebar = () => setIsSidebarOpen(true)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, openSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
