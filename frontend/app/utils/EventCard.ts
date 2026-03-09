import { Schedule } from "@/app/models/Schedule";

export const REM_HEIGHT_PER_HOUR = 5;
const DAY_START_HOUR = 8;

function parseHour(value: string): number {
  const hour = Number(value.split(":")[0]);
  return Number.isNaN(hour) ? DAY_START_HOUR : hour;
}

// Calculates the style for an event card based on its position and overlap with other events.
// It determines the height, top offset, width, and left offset of the card.
export function calculateECPosition(schedule: Schedule, occupiedHours: number[][]) {
  // calculate styles based on the schedule
  const eventStartTime = parseHour(schedule.start);
  const eventEndTime = parseHour(schedule.end);
  const eventDuration = (eventEndTime - eventStartTime) * REM_HEIGHT_PER_HOUR

  // calculate the top offset based on the start time
  const topOffset = (eventStartTime - DAY_START_HOUR) * REM_HEIGHT_PER_HOUR

  // calculate left offset based on occupied hours
  const startHourIndex = eventStartTime - DAY_START_HOUR
  const endHourIndex = eventEndTime - DAY_START_HOUR

  // widthDivisionFactor determines how mucho horizontal space
  // to allocate for overlapping events
  let widthDivisionFactor = 1
  // leftCurrentMaxCollisions is used to determine the left offset
  let leftCurrentMaxCollisions = 0
  // add 1 to the occupied slots for each hour in the range

  for (let i = startHourIndex; i < endHourIndex; i++) {
    if (i < 0 || i >= occupiedHours.length) continue
    // use the maximum number of overlaps at the moment
    leftCurrentMaxCollisions = Math.max(leftCurrentMaxCollisions, occupiedHours[i][1])
    // update the number of occupied slots to help render the next schedule event properly
    occupiedHours[i][1] += 1
    // update the width division factor to the maximum number of overlaps at this time
    widthDivisionFactor = Math.max(widthDivisionFactor, occupiedHours[i][0])
  }
  const width = 100 / widthDivisionFactor
  const left = leftCurrentMaxCollisions * width

  return {
    height: `${eventDuration}rem`,
    top: `${topOffset}rem`,
    width: `${width}%`,
    left: `${left}%`
  }
}
