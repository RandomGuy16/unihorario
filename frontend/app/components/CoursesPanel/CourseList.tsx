import { useMemo } from 'react'
import Tabs from './Tabs/Tabs'
import CourseCard from './CourseCard'
import SearchFilter from './SearchFilter/SearchFilter'
import { Course } from "@/app/models/Course";
import { getCourseColor } from "@/app/utils/CourseCard";
import { useResponsive } from "@/app/providers/useResponsive";
import { useSidebar } from "@/app/providers/useSidebar";
import { useCourseCache } from "@/app/providers/useCourseCache";
import { useFilters } from "@/app/providers/useFilters";
// import { useCurriculum } from "@/app/reducers/useCurriculum";
// import { generateCourseKey } from "@/app/providers/useCourseCache";


function renderCoursesSidebar(courses: Course[]) {
  // list to append all formatted course items
  const courseItemsList = []
  for (let i = 0; i < courses.length; i++) {
    // create a course variable and initialize its unique key
    const course = courses[i]
    const itemKey = `${i}CourseCard:` + course.getId() + course.getName() + course.getCredits()
    const colorPair = getCourseColor(course.getId())

    // append the course item to the list
    courseItemsList.push(
      <CourseCard
        key={itemKey}
        course={course}
        colorPair={colorPair}
      >
      </CourseCard>
    )
  }
  return courseItemsList
}


function CourseList() {
  //const { courseRegistry } = useCurriculum()
  const { isMobile } = useResponsive()
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const { allCourses, getCoursesByFilters } = useCourseCache()
  const { selection } = useFilters()

  const coursesToRender = useMemo(() => {
    if (allCourses.size === 0) return []
    return getCoursesByFilters(selection)
  }, [allCourses, selection, getCoursesByFilters])

  return (
    <div className={`
      w-full h-full mx-auto p-4 rounded-r-lg flex flex-col justify-start items-stretch
      shadow-elev-2 bg-surface
      transform transition-transform duration-300 ease-in-out
      ${(isMobile)
        ? `fixed top-0 left-0 max-w-sm z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        : 'sticky'}
    `}>
      <Tabs
        tabs={[{
          id: "courses-menu",
          label: "Tus cursos",
          content: (
            <>
              <div className="flex flex-row justify-between items-center">
                <h2 className="inline-block ml-2 text-title">Tus cursos</h2>
                {(isMobile) && <button
                  className="text-title my-2 ml-4 px-2 rounded-xl hover:bg-surface-muted"
                  onClick={() => toggleSidebar()}>
                  {'>'}
                </button>}

              </div>

              <section className="text-label w-full h-fit my-4">
                <span className="inline-block mb-2">Filtrar por:</span>
                <SearchFilter />
              </section>
              <section className="flex flex-col justify-start items-stretch w-full min-h-20 h-fit my-4">
                <span className="inline-block text-label mb-2">Cursos</span>
                <div
                  className="flex flex-col justify-start items-center flex-1 p-2
                    border-2 border-border rounded-md overflow-y-auto
                    scrollbar-thin scrollbar-thumb-border scrollbar-track-surface-muted"
                >
                  {coursesToRender && renderCoursesSidebar(coursesToRender)}
                </div>
              </section>
            </>
          )
        }]}
      />
    </div >
  )
}

export default CourseList
