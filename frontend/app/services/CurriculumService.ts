import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";
import { Course } from "@/app/models/Course";
import { generateCourseKey } from "@/app/contexts/useCourseCache";


export const CurriculumService = {
  /**
   * This function loads the JSON data from the server and formats it.
   * @returns the formatted data
   */
  async fetchCurriculum(): Promise<UniversityCurriculum> {
    const response = await fetch('./UNMSM-FISI.json')
    // wait for the response
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },

  createCourseRegistry(data: UniversityCurriculum) {
    const registry = new Map<string, Course>()

    const careers = data.years
      .flatMap(y => y.careerCurriculums)

    console.log("createCourseRegistry::careers: ", careers)

    // iterate over all courses in the cycle
    for (const career of careers) {
      const cycles = career.cycles
      for (const cycle of cycles) {
        for (const section of cycle.courseSections) {
          // create a key to use in the rendered courses tracker
          // const courseKey = createCourseKey({section, career: career.metadata.school})
          const courseKey = generateCourseKey(
            section.year,
            section.assignmentId,
            section.assignment,
            career.metadata.school
          )
          // if the course is already not present in the registry, create it
          if (!registry.has(courseKey)) {
            registry.set(courseKey, new Course(
              section.assignmentId,
              section.assignment,
              section.credits,
              section.teacher,
              career.metadata.school,
              section.year
            ))
          }
          registry.get(courseKey)!.addSection(section)
        }
      }
    }

    return registry
  }
}