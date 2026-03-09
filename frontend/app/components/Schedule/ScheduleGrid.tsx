import ScheduleEventCard from './ScheduleEventCard'
import ScheduleStatusHeader from "./ScheduleStatusHeader";
import { ReactElement, useMemo } from 'react'
import { Schedule } from "@/app/models/Schedule";
import { calculateECPosition } from "@/app/utils/EventCard";
import { useCourseCache } from "@/app/providers/useCourseCache";


const MONDAY_ID = "monday"
const TUESDAY_ID = "tuesday"
const WEDNESDAY_ID = "wednesday"
const THURSDAY_ID = "thursday"
const FRIDAY_ID = "friday"
const SATURDAY_ID = "saturday"
const SUNDAY_ID = "sunday"
const DAY_START_HOUR = 8
const DAY_TOTAL_HOURS = 15


// important interfaces/constants

// define days available
type DayKey = "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO"
const DAYS_MAP: Record<DayKey, number> = {
  "LUNES": 0,
  "MARTES": 1,
  "MIERCOLES": 2,
  "JUEVES": 3,
  "VIERNES": 4,
  "SABADO": 5,
} as const

// define day data
interface DayData {
  schedules: Schedule[];
  eventCards: ReactElement[];
  occupiedSlots: number[][];  // slots occupied by events;
}


// element for the calendar grid
function ScheduleGrid() {
  const { selectedSections } = useCourseCache()

  const visibleSections = useMemo(
    () => Array.from(selectedSections)
      .filter((section) => section.courseVisible)
      .sort((left, right) =>
        left.assignmentId - right.assignmentId ||
        left.sectionNumber - right.sectionNumber
      ),
    [selectedSections]
  )

  const filteredData = useMemo(() => {
    const daysData: DayData[] = Array.from({ length: 6 }, () => {
      return {
        schedules: [],
        eventCards: [],
        occupiedSlots: Array.from({ length: DAY_TOTAL_HOURS }, () => [0, 0])
      }
    })

    // first foreach loop to fill the daysData with schedules and occupied slots
    visibleSections.forEach((section) => {
      section.schedules.forEach((schedule) => {
        const dayIndex = DAYS_MAP[schedule.day.toUpperCase() as DayKey]
        // skip if not a valid day
        if (dayIndex === undefined) return

        // mark the slots as occupied
        const startHourIndex = Number(schedule.start.split(':')[0]) - DAY_START_HOUR
        const endHourIndex = Number(schedule.end.split(':')[0]) - DAY_START_HOUR
        // add 1 to the occupied slots for each hour in the range
        for (let i = startHourIndex; i < endHourIndex; i++) {
          if (i < 0 || i >= DAY_TOTAL_HOURS) continue
          daysData[dayIndex].occupiedSlots[i][0] += 1
        }
        daysData[dayIndex].schedules.push(schedule)
      })
    })

    // second foreach loop to fill the event cards
    visibleSections.forEach((section) => {
      const sortedSchedules = [...section.schedules].sort((left, right) =>
        left.day.localeCompare(right.day) ||
        left.start.localeCompare(right.start) ||
        left.end.localeCompare(right.end) ||
        left.scheduleNumber - right.scheduleNumber
      )

      sortedSchedules.forEach((schedule) => {
        const dayIndex = DAYS_MAP[schedule.day.toUpperCase() as DayKey]
        // skip if not a valid day
        if (dayIndex === undefined) return

        const eventCard = (<ScheduleEventCard
          key={`${section.assignmentId}-${section.sectionNumber}-${schedule.scheduleNumber}-${schedule.day}-${schedule.start}-${schedule.end}`}
          schedule={schedule}
          section={section}
          positionStyle={calculateECPosition(schedule, daysData[dayIndex].occupiedSlots)}
        />)
        daysData[dayIndex].eventCards.push(eventCard)
      })
    })
    return daysData
  }, [visibleSections])

  // Lists to store the schedules of each day
  const mondayData = filteredData[0]
  const tuesdayData = filteredData[1]
  const wednesdayData = filteredData[2]
  const thursdayData = filteredData[3]
  const fridayData = filteredData[4]
  const saturdayData = filteredData[5]

  const eventsColumnStyles = "flex flex-1 flex-col justify-start items-center relative h-full border-l border-border-strong"

  return (
    <div className="flex flex-col justify-start items-stretch w-full my-4">
      <div className="w-full min-h-24">
        <ScheduleStatusHeader
          daysSchedules={[
            mondayData.schedules, tuesdayData.schedules,
            wednesdayData.schedules, thursdayData.schedules,
            fridayData.schedules, saturdayData.schedules
          ]}
        />
      </div>
      <div className="
        flex flex-col justify-start items-stretch w-full relative
        bg-surface rounded-xl shadow-elev-2"
        id="calendar-grid">
        <div className="
        flex flex-8 flex-row justify-evenly items-center w-full max-h-6 rounded-t-xl font-light
        text-foreground bg-surface-muted cursor-default">
          <div className="flex flex-1 max-w-12 md:max-w-12 lg:max-w-16 flex-col justify-evenly items-center"></div>
          {["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"].map(
            (day, i) => (<div key={i} className="m-auto text-center flex-1">{day}</div>)
          )}
        </div>
        <div className="flex flex-8 flex-row justify-evenly items-start overscroll-y-auto h-full">
          <div className="flex flex-1 max-w-12 md:max-w-12 lg:max-w-16 flex-col justify-evenly items-stretch text-right">
            {["08", "09", 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(
              (hour, i) => (<div key={i} className="
                h-20 p-1 border-t border-border-strong text-foreground
                text-right text-micro md:text-caption lg:text-body">{`${hour}:00`}</div>)
            )}
          </div>
          <div className="flex flex-7 flex-row justify-evenly items-center h-full"
            id='calendar-appointments'>
            <div className={eventsColumnStyles} id={MONDAY_ID}>{mondayData.eventCards}</div>
            <div className={eventsColumnStyles} id={TUESDAY_ID}>{tuesdayData.eventCards}</div>
            <div className={eventsColumnStyles} id={WEDNESDAY_ID}>{wednesdayData.eventCards}</div>
            <div className={eventsColumnStyles} id={THURSDAY_ID}>{thursdayData.eventCards}</div>
            <div className={eventsColumnStyles} id={FRIDAY_ID}>{fridayData.eventCards}</div>
            <div className={eventsColumnStyles} id={SATURDAY_ID}>{saturdayData.eventCards}</div>
            <div className={eventsColumnStyles} id={SUNDAY_ID}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleGrid
