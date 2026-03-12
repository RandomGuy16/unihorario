import * as htmlToImage from 'html-to-image'
import { Sheet, Image } from 'lucide-react'
import ExcelJS, { Worksheet } from 'exceljs'
import { Schedule } from "@/app/models/Schedule";
import { capitalize } from "@/app/utils/misc";
import { useCourseCache } from "@/app/providers/useCourseCache";
import { useCredits } from "@/app/providers/useCredits";
import { logger } from "@/app/utils/logger";
import { useState } from "react";


// Represents a time slot with start and end times
interface Hour {
  start: string;
  end: string;
}

// Available time slots for the schedule, from 8 AM to 9 PM
const HOURS: Hour[] = [
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
  { start: "18:00", end: "19:00" },
  { start: "19:00", end: "20:00" },
  { start: "20:00", end: "21:00" }
]

/**
 * Checks if a schedule overlaps with or fits within a given hour slot
 * @param schedule - The schedule to check
 * @param hour - The hour slot to check against
 * @returns boolean indicating if the schedule fits in the hour slot
 */
function isScheduleInHourSlot(schedule: Schedule, hour: Hour) {
  const scheduleStart = Number(schedule.start.split(':')[0])
  const scheduleEnd = Number(schedule.end.split(':')[0])
  const hourStart = Number(hour.start.split(':')[0])
  const hourEnd = Number(hour.end.split(':')[0])

  return (scheduleStart <= hourStart && hourEnd <= scheduleEnd)
}

/**
 * Generates a label for an Excel cell based on schedules in a specific hour
 * @param daySchedules - Array of schedules for a specific day
 * @param hour - The hour slot to check
 * @returns A string containing assignment name and schedule number, or empty string if no match
 */
function getCellLabel(daySchedules: Schedule[], hour: Hour) {
  let result = ""
  const SchedulesInCell: Schedule[] = daySchedules.filter(schedule => isScheduleInHourSlot(schedule, hour))

  SchedulesInCell.forEach((schedule: Schedule) => {
    result += `${capitalize(schedule.assignment)}\nsección ${schedule.sectionNumber}\n${schedule.teacher}`
  })

  return result
}

interface ScheduleStatusHeaderProps {
  daysSchedules: Schedule[][];  // 2D array containing schedules for each day
}
export default function ScheduleStatusHeader({ daysSchedules }: ScheduleStatusHeaderProps) {
  const { selectedCoursesCount } = useCourseCache()
  const { credits } = useCredits()
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingImage, setIsExportingImage] = useState(false)

  /**
   * Exports the calendar grid as a PNG image
   * Uses html-to-image library to convert the DOM element to image
   */
  const exportImage = async () => {
    try {
      setIsExportingImage(true)
      const calendarGrid = document.getElementById('calendar-grid')!
      const downloadUrl = await htmlToImage.toPng(calendarGrid)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'schedule.png'
      link.click()
    } catch (error) {
      logger.error("Failed to export schedule image", error)
    } finally {
      setIsExportingImage(false)
    }
  }

  /**
   * Exports the schedule to an Excel file
   * Creates a worksheet with time slots as rows and days as columns
   * Populates cells with course assignments that occur in each time slot
   */
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet: Worksheet = workbook.addWorksheet('Schedule')

    // Define columns for the worksheet
    worksheet.columns = [
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Monday', key: 'monday', width: 15 },
      { header: 'Tuesday', key: 'tuesday', width: 15 },
      { header: 'Wednesday', key: 'wednesday', width: 15 },
      { header: 'Thursday', key: 'thursday', width: 15 },
      { header: 'Friday', key: 'friday', width: 15 },
      { header: 'Saturday', key: 'saturday', width: 15 }
    ]
    // Add rows for each hour slot
    HOURS.forEach((hour: Hour) => {
      worksheet.addRow({
        time: hour.start + ' - ' + hour.end,
        monday: getCellLabel(daysSchedules[0], hour),
        tuesday: getCellLabel(daysSchedules[1], hour),
        wednesday: getCellLabel(daysSchedules[2], hour),
        thursday: getCellLabel(daysSchedules[3], hour),
        friday: getCellLabel(daysSchedules[4], hour),
        saturday: getCellLabel(daysSchedules[5], hour)
      })
    })

    // Generate and download the Excel file
    try {
      setIsExportingExcel(true)
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'applicacion/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'my-schedule.xlsx'
      anchor.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      logger.error("Failed to export schedule workbook", error)
    } finally {
      setIsExportingExcel(false)
    }
  }

  return (
    <div className="flex flex-col p-2 h-full w-full select-none">
      <h2 className="text-heading">Horario</h2>
      {/* Schedule metrics */}
      <div className="flex flex-1 flex-row justify-between items-center w-full">
        <div className="mx-2 text-body">
          <div>
            <span>Cursos: {selectedCoursesCount}</span><br />
            <span>Créditos: {credits}</span>
          </div>
        </div>
        {/* Export buttons */}
        {/* Light theme: #059669 (green-600)
            Dark theme: #10B981 (emerald-500)
            Light theme: #2563EB (blue-600)
            Dark theme: #3B82F6 (blue-500) */}
        <div className="mx-2 flex flex-row justify-center items-center text-control">
          <span className="mx-1 my-2 text-foreground">Exportar:</span>
          <div className='flex flex-row justify-center items-start gap-1'>
            <button
              className="
              p-1 px-2 border border-transparent rounded-lg shadow-elev-1 text-on-action
              cursor-pointer bg-action-primary/90 hover:bg-action-primary transition-all duration-100"
              export-type="image"
              disabled={isExportingImage}
              aria-busy={isExportingImage}
              onClick={() => exportImage()}>
              {isExportingImage
                ? (<span>exportando...</span>)
                : (<><Image aria-label={"idk"} className="inline mr-1 h-4" /><span>imagen</span></>)}
            </button>
            <button
              className="
              p-1 px-2 border border-transparent rounded-lg shadow-elev-1 text-on-action
              cursor-pointer bg-action-success/90 hover:bg-action-success transition-all duration-100"
              export-type="excel"
              disabled={isExportingExcel}
              aria-busy={isExportingExcel}
              onClick={() => exportToExcel()}>
              {isExportingExcel
                ? (<span>exportando...</span>)
                : (<><Sheet aria-label={'idk'} className="inline mr-1 h-4" /><span>excel</span></>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
