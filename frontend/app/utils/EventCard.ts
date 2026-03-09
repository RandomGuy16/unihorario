import { Schedule } from "@/app/models/Schedule";

export const REM_HEIGHT_PER_HOUR = 5;
const DAY_START_HOUR = 8;
const MIN_WIDTH_DIVISION = 1;

function parseHour(value: string): number {
  const hour = Number(value.split(":")[0]);
  return Number.isNaN(hour) ? DAY_START_HOUR : hour;
}

// Calculates position and size for an event card using deterministic lane assignment data.
export function calculateECPosition(schedule: Schedule, laneIndex: number, maxConcurrent: number) {
  // calculate styles based on the schedule
  const eventStartTime = parseHour(schedule.start);
  const eventEndTime = parseHour(schedule.end);
  const eventDuration = (eventEndTime - eventStartTime) * REM_HEIGHT_PER_HOUR

  // calculate the top offset based on the start time
  const topOffset = (eventStartTime - DAY_START_HOUR) * REM_HEIGHT_PER_HOUR

  // Each lane gets an equal width slice based on the peak overlap for this event.
  const widthDivisionFactor = Math.max(maxConcurrent, MIN_WIDTH_DIVISION)
  const width = 100 / widthDivisionFactor
  const left = laneIndex * width

  return {
    height: `${eventDuration}rem`,
    top: `${topOffset}rem`,
    width: `${width}%`,
    left: `${left}%`
  }
}
