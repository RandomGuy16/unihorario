"use client"
import { createContext, useContext, useState, ReactNode } from "react"


export interface CreditsContextType {
  credits: number;
  addCredits: (credits: number) => void;
  restCredits: (credits: number) => void;
  resetCredits: () => void
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

export function CreditsContextProvider({children}: {children: ReactNode}) {
  const [credits, setCredits] = useState<number>(0)
  return (
    <CreditsContext.Provider value={{
      credits,
      addCredits: (credits: number) => setCredits(credits + credits),
      restCredits: (credits: number) => setCredits(credits - credits),
      resetCredits: () => setCredits(0)
    }}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsContextProvider')
  }
  return context
}
