import Image from "next/image";
import {useEffect, useState} from "react";
import {loadJSON} from "@/app/components/global/loaddata";
import CourseList from "@/app/components/SchedulePlanner/CoursesPanel/CourseList";
import ScheduleGrid from "@/app/components/SchedulePlanner/Schedule/ScheduleGrid";
import {CourseSection} from "@/app/models/CourseSection";
import {UniversityCurriculum} from "@/app/models/UniversityCurriculum";
import {Course} from "@/app/models/Course";
//import CourseCacheService from "@/app/services/CourseCacheService";
//import {useCredits} from "@/app/contexts/useCredits";

export default function Home() {

  // Core data state, don't touch
  const [data, setData] = useState<UniversityCurriculum>()
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false)

  const [visibleSections, setVisibleSections] = useState<Set<CourseSection>>(new Set())

  const [courseTracker, setCourseTracker] = useState<Map<string, Course>>(new Map())

  // CRUD operations for the set
  // implemented using the functional update form of useState

  // starting with the CRUD of the course and credits counter


  // Load the JSON data and set the data state
  // This is done in a useEffect to avoid blocking the main thread
  // and to avoid the use of async/await in the main function
  useEffect(() => {
    const fetchData = async () => {
      try {
        // load the JSON data
        const jsonData: UniversityCurriculum | null = await loadJSON()

        // get the courses from the data
        setData(jsonData!)
        setIsDataLoaded(true)
      } catch (error) {
        // in the future add a label to tell the user the data couldn't load properly
        console.error("Error loading JSON data: ", error)
        setIsDataLoaded(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="grid calendar-layout relative">
      <aside className="area-sidebar fixed top-20 z-50 left-0 h-[calc(100vh-5rem)] md:w-[300px] lg:w-[360px] grid-rows-1 row-span-1 flex flex-col justify-start items-center">
        <CourseList
          data={data}
          isDataLoaded={isDataLoaded}
          sectionOps={{
            addSections: addSections,
            removeSections: removeSections,
            hasSection: hasSection,
            clearSections: clearSecTracker,
            trackCourse: addCourse,
            untrackCourse: removeCourse,
            setCourseVisible: setCourseVisible,
            setCourseInvisible: setCourseInvisible
          }}
        />
      </aside>
      <main className="area-main row-span-1 w-full h-full flex flex-row justify-center">
        <ScheduleGrid
          selectedSections={Array.from(visibleSections)}
          courseTracker={courseTracker}
          credits={credits}
        />
      </main>
    </div>
  )
}
