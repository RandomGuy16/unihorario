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
}

interface ScheduleEventLayout {
  sectionIndex: number;
  schedule: Schedule;
  startHourIndex: number;
  endHourIndex: number;
  laneIndex: number;
  maxConcurrent: number;
}

function parseHourIndex(time: string): number {
  const hour = Number(time.split(":")[0])
  if (Number.isNaN(hour)) return 0
  return hour - DAY_START_HOUR
}

function getScheduleIdentityValue(schedule: Schedule): string {
  return `${schedule.assignmentId}-${schedule.sectionNumber}-${schedule.scheduleNumber}-${schedule.day}-${schedule.start}-${schedule.end}`
}

function buildDayLayouts(events: ScheduleEventLayout[]): ScheduleEventLayout[] {
  if (!events.length) return []

  // Count overlaps per hour slot for width calculation.
  const occupancy = Array.from({ length: DAY_TOTAL_HOURS }, () => 0)
  for (const event of events) {
    for (let i = event.startHourIndex; i < event.endHourIndex; i++) {
      if (i < 0 || i >= DAY_TOTAL_HOURS) continue
      occupancy[i] += 1
    }
  }

  const sorted = [...events].sort((left, right) =>
    left.startHourIndex - right.startHourIndex ||
    left.endHourIndex - right.endHourIndex ||
    left.sectionIndex - right.sectionIndex ||
    getScheduleIdentityValue(left.schedule).localeCompare(getScheduleIdentityValue(right.schedule))
  )

  // Keep active events to assign the smallest available lane deterministically.
  const active: Array<{ endHourIndex: number; laneIndex: number }> = []
  const assigned = sorted.map((event) => {
    // Remove lanes from events that already ended before current start.
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].endHourIndex <= event.startHourIndex) active.splice(i, 1)
    }

    const usedLanes = new Set(active.map((item) => item.laneIndex))
    let laneIndex = 0
    while (usedLanes.has(laneIndex)) laneIndex += 1

    active.push({ endHourIndex: event.endHourIndex, laneIndex })

    // Width is based on peak overlap in this event's time range.
    let maxConcurrent = 1
    for (let i = event.startHourIndex; i < event.endHourIndex; i++) {
      if (i < 0 || i >= DAY_TOTAL_HOURS) continue
      maxConcurrent = Math.max(maxConcurrent, occupancy[i])
    }

    return {
      ...event,
      laneIndex,
      maxConcurrent
    }
  })

  return assigned
}


// element for the calendar grid
function ScheduleGrid() {
  const { selectedSections } = useCourseCache()

  const visibleSections = useMemo(
    () => Array.from(selectedSections)
      .filter((section) => section.courseVisible)
      .sort((left, right) =>
        left.sectionNumber - right.sectionNumber
      ),
    [selectedSections]
  )

  const filteredData = useMemo(() => {
    const daysData: DayData[] = Array.from({ length: 6 }, () => {
      return {
        schedules: [],
        eventCards: []
      }
    })
    const dayLayouts: ScheduleEventLayout[][] = Array.from({ length: 6 }, () => [])

    visibleSections.forEach((section, sectionIndex) => {
      section.schedules.forEach((schedule) => {
        const dayIndex = DAYS_MAP[schedule.day.toUpperCase() as DayKey]
        if (dayIndex === undefined) return

        const startHourIndex = parseHourIndex(schedule.start)
        const endHourIndex = parseHourIndex(schedule.end)
        if (endHourIndex <= startHourIndex) return

        daysData[dayIndex].schedules.push(schedule)
        dayLayouts[dayIndex].push({
          sectionIndex,
          schedule,
          startHourIndex,
          endHourIndex,
          laneIndex: 0,
          maxConcurrent: 1
        })
      })
    })

    dayLayouts.forEach((events, dayIndex) => {
      const laidOutEvents = buildDayLayouts(events)
      laidOutEvents.forEach((event) => {
        const section = visibleSections[event.sectionIndex]
        if (!section) return
        const eventCard = (<ScheduleEventCard
          key={getScheduleIdentityValue(event.schedule)}
          schedule={event.schedule}
          section={section}
          positionStyle={calculateECPosition(event.schedule, event.laneIndex, event.maxConcurrent)}
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
