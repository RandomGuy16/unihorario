"use client"
import { Calendar } from "lucide-react"
import { useResponsive } from "@/app/providers/useResponsive";
import { useSidebar } from "@/app/providers/useSidebar"


function Header() {
  const { isMobile } = useResponsive()
  const { toggleSidebar } = useSidebar()
  return (
    <>
      <header className="area-header sticky flex flex-row justify-between items-center w-full top-0 z-30 h-20 p-1 bg-surface
      shadow-elev-1 select-none">
        <div className="flex flex-row justify-between items-center ml-6">
          {isMobile &&
            <button
              className="px-2 rounded-xl hover:bg-surface-muted duration-100"
              onClick={() => toggleSidebar()}>
              <span className="text-title">☰</span>
            </button>
          }
          <Calendar className="ml-4 mr-2 text-accent" />
          <h1 className="text-heading font-normal">UniHorario</h1>
        </div>
      </header>
    </>
  )
}

export default Header
