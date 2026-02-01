import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";
import { Course } from "@/app/models/Course";
import { generateCourseKey } from "@/app/providers/useCourseCache";
import { SubmitCurriculumResponse } from "@/app/models/dto";


export const CurriculumService = {
  /**
   * This function loads the JSON data from the server and formats it.
   * @returns the formatted data
   */
  async fetchCurriculum(school: string): Promise<UniversityCurriculum> {
    const params = new URLSearchParams()
    params.append('school', school)
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
    const response = await fetch(`${baseUrl}/api/curriculum?${params}`)
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
          const teachers = new Set<string>()
          section.schedules.map(schedule => teachers.add(schedule.teacher))
          // create a key to use in the rendered courses tracker
          // const courseKey = createCourseKey({section, career: career.metadata.school})
          const courseKey = generateCourseKey(
            career.metadata.studyPlan,
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
              Array.from(teachers),
              career.metadata.school,
              career.metadata.studyPlan,
              cycle.cycle
            ))
          }
          registry.get(courseKey)!.addSection(section)
        }
      }
    }

    return registry
  },

  async submitCurriculumFile(file: File): Promise<SubmitCurriculumResponse> {
    // wrap the file in a FormData
    const formData = new FormData()
    formData.append('file', file)

    // send the file to the backend
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
    const response = await fetch(`${apiBaseUrl}/api/curriculum`, {
      method: 'POST',
      body: formData
    })
    // check the response
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },

  async awaitCurriculumParsing(curriculumCreationJobId: string): Promise<UniversityCurriculum> {
    const params = new URLSearchParams()
    params.append('jobId', curriculumCreationJobId)
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
    const response = await fetch(`${baseUrl}/api/jobs/await_job/${params}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  }
}
