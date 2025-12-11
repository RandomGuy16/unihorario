import { useEffect, useState } from 'react'
import Tabs from './Tabs/Tabs.tsx'
import CourseCard from './CourseCard.tsx'
import SearchFilter from './SearchFilter/SearchFilter.tsx'
import { getCoursesFromData, initializeFilters } from '../../global/loaddata.ts'
import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";
import { Course } from "@/app/models/Course";
import { getCourseColor } from "@/app/utils/CourseCard";
import { useResponsive } from "@/app/contexts/useResponsive";
import { useSidebar } from "@/app/contexts/useSidebar";
import {FilterChooser, Filters} from "@/app/models/Filters";
import {SectionSelectionOps} from "@/app/services/CourseCacheService";


function renderCoursesSidebar(courses: Course[], sectionOps: SectionSelectionOps) {
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
        sectionOps={sectionOps}
        colorPair={colorPair}
      >
      </CourseCard>
    )
  }
  return courseItemsList
}

// attributes for CourseList
interface CourseListProps {
  data: UniversityCurriculum | undefined;
  isDataLoaded: boolean;
  sectionOps: SectionSelectionOps;
}

function CourseList({ data, isDataLoaded, sectionOps }: CourseListProps) {
  const { isMobile } = useResponsive()
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const [courses, setCourses] = useState<Course[]>([])
  const [filters, setFilters] = useState<FilterChooser>({
    cycles: [],
    years: [],
    careers: []
  })
  const [chosenFilters, setChosenFilters] = useState<Filters>({
    cycle: 'CICLO 4',
    career: 'Ingeniería De Sistemas',
    year: '2023'
  })

  useEffect(() => {
    if (isDataLoaded && data) {
      setFilters(initializeFilters(data))
      setCourses(getCoursesFromData(data))
    }
  }, [data, isDataLoaded])

  useEffect(() => {
    if (isDataLoaded && data) {
      setCourses(getCoursesFromData(data, chosenFilters))
    }
  }, [chosenFilters]);

  return (
    <div className={`
      w-full h-full mx-auto p-4 rounded-r-lg flex flex-col justify-start items-stretch
      shadow-lg bg-white dark:bg-neutral-800 dark:shadow-md dark:shadow-black
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
                <h2 className="inline-block ml-2 font-normal text-lg">Tus cursos</h2>
                {(isMobile) && <button
                  className="text-lg my-2 ml-4 px-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  onClick={() => toggleSidebar()}>
                  {'>'}
                </button>}

              </div>

              <section className="text-base w-full h-fit my-4">
                <span className="inline-block font-normal mb-2">Filtrar por:</span>
                <SearchFilter
                  filterChooser={filters}
                  selectedFilters={chosenFilters}
                  setSelectedFiltersSet={setChosenFilters}
                  sectionOps={sectionOps}
                />
              </section>
              <section className="flex flex-col justify-start items-stretch w-full min-h-20 h-fit my-4">
                <span className="inline-block font-normal mb-2">Cursos</span>
                <div
                  className="flex flex-col justify-start items-center flex-1 p-2
                    border-2 border-neutral-200 dark:border-neutral-700 rounded-lg overflow-y-auto
                    scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
                    dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-800"
                >
                  {isDataLoaded && renderCoursesSidebar(courses, sectionOps)}
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
