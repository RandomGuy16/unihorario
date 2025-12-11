import { Calendar } from "lucide-react"
import { useResponsive } from "@/app/contexts/useResponsive";
import { useSidebar } from "@/app/contexts/useSidebar"


function Header() {
  const { isMobile } = useResponsive()
  const { toggleSidebar } = useSidebar()
  return (
    <>
      <header className="area-header sticky top-0 z-30 h-20 w-full bg-white dark:bg-neutral-800 flex flex-row justify-between items-center
      shadow-md dark:shadow-black">
        <div className="flex flex-row justify-between items-center ml-6">
          {isMobile &&
            <button
              className="px-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 duration-100"
              onClick={() => toggleSidebar()}>
              <span className="text-lg">☰</span>
            </button>
          }
          <Calendar className="ml-4 mr-2 text-blue-500 dark:text-blue-400" />
          <h1 className="text-xl font-normal">UniHorario</h1>
        </div>
      </header>
    </>
  )
}

export default Header
