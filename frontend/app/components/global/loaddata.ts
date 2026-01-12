import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";


// entrypoint to load JSON
/**
 * This function loads the JSON data from the server and formats it.
 * @returns the formatted data
 */
export async function loadJSON() {
  try {
    const response = await fetch('./UNMSM-FISI.json')
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
*/

/**
 * This function formats the JSON data from the server into a more usable format.
 * Formats the data into the objects declared in global/types.ts
 * @param rawJSONData the data from the JSON file
 * @returns the formatted data

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
 */
