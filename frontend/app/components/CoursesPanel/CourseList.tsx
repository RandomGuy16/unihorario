import { useEffect, useMemo } from 'react'
import Tabs from './Tabs/Tabs'
import CourseCard from './CourseCard'
import SearchFilter from './SearchFilter/SearchFilter'
import { Course } from "@/app/models/Course";
import { getCourseColor } from "@/app/utils/CourseCard";
import { useResponsive } from "@/app/contexts/useResponsive";
import { useSidebar } from "@/app/contexts/useSidebar";
import { useCourseCache } from "@/app/contexts/useCourseCache";
import { useFilters } from "@/app/contexts/useFilters";
import { useCurriculum } from "@/app/reducers/useCurriculum";
import { generateCourseKey } from "@/app/contexts/useCourseCache";


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
  const { data } = useCurriculum()
  const { isMobile } = useResponsive()
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const { getCourseInstance, allCourses } = useCourseCache()
  const { selection } = useFilters()

  const coursesToRender = useMemo(() => {
    if (!data) return []

    const filteredCourses: Course[] = []
    const seenIds = new Set<string>()

    const filteredCycles = data!.years
      .filter(y => !selection.year || y.year === selection.year)
      .flatMap(y => y.careerCurriculums)
      .filter(c => !selection.career || c.metadata.school === selection.career)
      .flatMap(c => c.cycles)
      .filter(cy => !selection.cycle || cy.cycle === selection.cycle);

    console.log("CourseList::filteredCycles: ", filteredCycles)
    console.log("useCourseCache::allCourses", allCourses)
    // iterate over all courses in the cycle
    for (const cycle of filteredCycles) {
      for (const section of cycle.courseSections) {
        // create a key to use in the rendered courses tracker
        const courseKey = generateCourseKey(
          section.year,
          section.assignmentId,
          section.assignment,
          selection.career
        )
        // get the instance of the course in the global course cache
        const courseInstance = getCourseInstance(courseKey)

        // push the section to the new course, or last course added
        if (courseInstance && !seenIds.has(courseInstance.getId())) {
          filteredCourses.push(courseInstance)
          seenIds.add(courseInstance.getId())
        }
      }
    }
    return filteredCourses
  }, [data, selection.year, selection.career, selection.cycle, getCourseInstance, allCourses])

  useEffect(() => {
    renderCoursesSidebar(coursesToRender)
  }, [coursesToRender])

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
                <SearchFilter/>
              </section>
              <section className="flex flex-col justify-start items-stretch w-full min-h-20 h-fit my-4">
                <span className="inline-block text-label mb-2">Cursos</span>
                <div
                  className="flex flex-col justify-start items-center flex-1 p-2
                    border-2 border-border rounded-md overflow-y-auto
                    scrollbar-thin scrollbar-thumb-[rgb(var(--color-border))] scrollbar-track-[rgb(var(--color-surface-muted))]"
                >
                  {data && renderCoursesSidebar(coursesToRender)}
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
