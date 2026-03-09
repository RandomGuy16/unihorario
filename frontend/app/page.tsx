"use client"
import CourseList from "@/app/components/CoursesPanel/CourseList";
import ScheduleGrid from "@/app/components/Schedule/ScheduleGrid";
import { CourseCacheContextProvider } from "@/app/providers/useCourseCache";
import { FiltersContextProvider } from "@/app/providers/useFilters";

export default function Home() {

  // Load the JSON data and set the data state
  // This is done in a useEffect to avoid blocking the main thread
  // and to avoid the use of async/await in the main function

  return (
    <div className="grid calendar-layout relative">
      <FiltersContextProvider>
        <CourseCacheContextProvider>
          <aside className="area-sidebar fixed top-20 z-50 left-0 h-[calc(100vh-5rem)] md:w-[300px] lg:w-[360px] grid-rows-1 row-span-1 flex flex-col justify-start items-center">
            <CourseList/>
          </aside>
          <main className="area-main row-span-1 w-full h-full flex flex-row justify-center">
            <ScheduleGrid/>
          </main>
        </CourseCacheContextProvider>
      </FiltersContextProvider>
    </div>
  )
}
