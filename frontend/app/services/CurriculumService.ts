import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";
import { Course } from "@/app/models/Course";
import { generateCourseKey } from "@/app/utils/courseKey";
import { AwaitJobResponse, SubmitCurriculumResponse } from "@/app/models/dto";

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

  createCourses(data: UniversityCurriculum) {
    const fetchedCourses = new Map<string, Course>()
    const careers = data.years
      .flatMap(y => y.careerCurriculums)

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
          // add course id to section
          section.courseKey = courseKey
          let course = fetchedCourses.get(courseKey)

          // Create the course once, then keep attaching all parsed sections to it.
          if (!course) {
            course = new Course(
              section.assignmentId,
              courseKey,
              section.assignment,
              section.credits,
              Array.from(teachers),
              career.metadata.school,
              career.metadata.studyPlan,
              cycle.cycle
            )
            fetchedCourses.set(courseKey, course)
          }

          course.addSection(section)
        }
      }
    }

    return fetchedCourses
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
    // const params = new URLSearchParams()
    // params.append('jobId', curriculumCreationJobId)
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
    const response = await fetch(`${baseUrl}/api/jobs/await_job/${curriculumCreationJobId}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data: AwaitJobResponse<UniversityCurriculum> = await response.json()
    if (!data.success) throw new Error('University curriculum parsing job failed')
    return data.result
  }
}
