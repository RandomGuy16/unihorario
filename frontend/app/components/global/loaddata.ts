
import {Cycle} from "@/app/models/Cycle";
import {Year} from "@/app/models/Year";
import {CourseSection} from "@/app/models/CourseSection";
import {Career} from "@/app/models/Career";
import {UniversityCurriculum} from "@/app/models/UniversityCurriculum";
import {Course} from "@/app/models/Course";
import {createCourseKey} from "@/app/services/CourseCacheService";
import {FilterChooser, Filters} from "@/app/models/Filters";


// entrypoint to load JSON
/**
 * This function loads the JSON data from the server and formats it.
 * @returns the formatted data
 */
export async function loadJSON() {
  try {
    const response = await fetch('./UNMSM-FISI.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    // wait for the response
    const jsonData = await response.json()
    return formatJSON(jsonData)
  } catch (error) {
    console.error("Error loading JSON data:", error)
    return null
  }
}


/**
 * Format the cycle and inner sections into a usable format.
 * This is due to Sonarqube warning about the use of indentation.
 * @param cycle the cycle name
 * @param sectionsList the sections list
 * @param year the year
 * @returns formated cycle
 */
function formatCycles([cycle, sectionsList]: [string, any], year: string) {
  return {  // cycle scope
    name: cycle,
    courseSections: sectionsList.length ? sectionsList.map((section: any) => {
      return {  // course section scope
        assignment: section["Asignatura"].split(" - ")[1],
        assignmentId: section["Asignatura"].split(" - ")[0],
        teacher: section["Docente"],
        maxStudents: section["Tope"] ?? "---",
        sectionNumber: Number(section["Sec_"]),
        credits: Number(section["Créd_"]),
        year: Number(year),
        courseVisible: true,  // default value
        schedules: section.Horarios.map((schedule: any) => {
          return {  // schedule scope
            assignment: section["Asignatura"].split(" - ")[1],
            assignmentId: section["Asignatura"].split(" - ")[0],
            day: schedule["Día"].toUpperCase(),
            start: schedule["Inicio"],
            end: schedule["Fin"],
            type: schedule["Tipo"],
            scheduleNumber: schedule["Horario"],
            sectionNumber: Number(section["Sec_"]),
            teacher: section["Docente"]
          }
        })
      }
    }) : []
  }
}


/**
 * This function formats the JSON data from the server into a more usable format.
 * Formats the data into the objects declared in global/types.ts
 * @param rawJSONData the data from the JSON file
 * @returns the formatted data
 */
function formatJSON(rawJSONData: any) {
  const formattedData: UniversityCurriculum = {
    years: Object.entries(rawJSONData).map(([year, careers]: [string, any]) => {
      return {
        year: year,
        careerCurriculums: Object.entries(careers).map(([career, cyclesObj]: [string, any]) => {
          return {
            name: career,
            cycles: Object.entries(cyclesObj).map(([cycle, sections]: [string, any])=> {
              return formatCycles([cycle, sections], year)
            })
          }
        })
      }
    })
  }
  return formattedData
}

/**
 * Create courses
 * */

// variable to implement memoization/caching with the courses
const courseCache: Map<string, Course> = new Map()

function getOrCreateCourse(courseKey: string, section: CourseSection, career: string) {
  if (courseCache.has(courseKey)) return courseCache.get(courseKey)!

  const newCourse = new Course(
    section.assignmentId,
    section.assignment,
    section.credits,
    section.teacher,
    career,
    section.year
  )
  courseCache.set(courseKey, newCourse)
  return newCourse
}

/**
 * Appends courses to CourseList
 * */
function appendCoursesToCourseList(cycle: Cycle, courses: Course[], career: string) {
  // course name checker, to filter out the courses
  let prevCourseName = ""
  for (const section of cycle.courseSections) {
    // create a key to use in the rendered courses tracker
    const newCourseKey = createCourseKey({ section, career })

    // check if the section belongs to a previous course added
    if (prevCourseName !== section.assignment) {  // if it is not, create a new course
      // append it to the course list as well
      courses.push(getOrCreateCourse(newCourseKey, section, career))
    }

    // push the section to the new course, or last course added
    if (!courses[courses.length - 1].hasSection(section)) {
      courses[courses.length - 1].addSection(section)
    }

    prevCourseName = section.assignment
  }
}


// entrypoint for rendering courses
/**
 * Render courses once data is loaded from the JSON files
 * @returns a list of courses based on filters established
 * */
export function getCoursesFromData(
  data: UniversityCurriculum,
  userFilters: Filters = {
    year: '2023',
    career: 'Ingeniería De Sistemas',
    cycle: 'CICLO 4',
  }) {
  const courses: Course[] = []

  /**
   * NOTES ON SCOPE OF THE PROJECT
   * for now, I'm not doing faculty level filtering. I'll first finish this in my faculty
   * scope. Then, I'm expanding the scope of this project to new faculties
   * */

  // iterate over all years following the filters
  const filteredYears: Year[] = data.years.filter((year: Year) => {
    console.log(year)
    return userFilters.year ? year.year === userFilters.year : true
  })
  for (const year of filteredYears) {
    // filter careers
    const filteredCareers: Career[] = year.careerCurriculums.filter((career: Career) => {
      return userFilters.career ? career.name === userFilters.career : true
    })
    for (const career of filteredCareers) {
      // filter cycles
      const filteredCycles: Cycle[] = career.cycles.filter((cycle: Cycle) => {
        return userFilters.cycle ? cycle.name === userFilters.cycle : true
      })
      for (const cycle of filteredCycles) {
        // iterate over all courses in the cycle
        appendCoursesToCourseList(cycle, courses, career.name)
      }
    }
  }
  return courses
}


export function initializeFilters(data: UniversityCurriculum) {
  // initialize a new filters object, we'll return its value
  const filters: FilterChooser = {
    cycles: [],
    years: [],
    careers: []
  }

  for (const year of data.years) {  // years
    filters.years.push(year.year)  // add every study plan
    for (const career of year.careerCurriculums) {  // career
      // if the career across the study plans isn't added, add it
      if (!filters.careers.includes(career.name)) {
        filters.careers.push(career.name)
      }
    }
  }
  // cycles, there's always 10; I'll update this if I expand the project
  for (let i = 1; i <= 10; i++) {
    filters.cycles.push(`CICLO ${i}`)
  }
  return filters
}
