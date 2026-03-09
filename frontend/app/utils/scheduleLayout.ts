import { Schedule } from "@/app/models/Schedule";

export const DAY_START_HOUR = 8;
export const DAY_TOTAL_HOURS = 15;

export interface ScheduleEventLayout {
  sectionIndex: number;
  schedule: Schedule;
  startHourIndex: number;
  endHourIndex: number;
  laneIndex: number;
  maxConcurrent: number;
}

export function parseHourIndex(time: string): number {
  const hour = Number(time.split(":")[0]);
  const minute = Number(time.split(":")[1]);
  if (Number.isNaN(hour)) return 0;
  return hour - DAY_START_HOUR + minute / 60;
}

export function getScheduleIdentityValue(schedule: Schedule): string {
  return `${schedule.assignmentId}-${schedule.sectionNumber}-${schedule.scheduleNumber}-${schedule.day}-${schedule.start}-${schedule.end}`;
}

export function buildDayLayouts(events: ScheduleEventLayout[]): ScheduleEventLayout[] {
  if (!events.length) return [];

  const sorted = [...events].sort((left, right) =>
    left.startHourIndex - right.startHourIndex ||
    left.endHourIndex - right.endHourIndex ||
    left.sectionIndex - right.sectionIndex ||
    getScheduleIdentityValue(left.schedule).localeCompare(getScheduleIdentityValue(right.schedule))
  );

  const groups: ScheduleEventLayout[][] = [];
  let currentGroup: ScheduleEventLayout[] = [];
  let currentGroupEnd = -1;

  // Split into connected overlap groups so all cards in one group share a width basis.
  for (const event of sorted) {
    if (!currentGroup.length || event.startHourIndex < currentGroupEnd) {
      currentGroup.push(event);
      currentGroupEnd = Math.max(currentGroupEnd, event.endHourIndex);
      continue;
    }

    groups.push(currentGroup);
    currentGroup = [event];
    currentGroupEnd = event.endHourIndex;
  }
  if (currentGroup.length) groups.push(currentGroup);

  return groups.flatMap((group) => {
    const active: Array<{ endHourIndex: number; laneIndex: number }> = [];
    const preferredLaneBySection = new Map<number, number>();
    let groupMaxConcurrent = 1;

    const withLane = group.map((event) => {
      // Remove lanes from events that already ended before current start.
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].endHourIndex <= event.startHourIndex) active.splice(i, 1);
      }

      const usedLanes = new Set(active.map((item) => item.laneIndex));
      const preferredLane = preferredLaneBySection.get(event.sectionIndex);
      let laneIndex = preferredLane !== undefined && !usedLanes.has(preferredLane) ? preferredLane : 0;
      while (usedLanes.has(laneIndex)) laneIndex += 1;

      active.push({ endHourIndex: event.endHourIndex, laneIndex });
      preferredLaneBySection.set(event.sectionIndex, laneIndex);
      groupMaxConcurrent = Math.max(groupMaxConcurrent, active.length);

      return { ...event, laneIndex };
    });

    return withLane.map((event) => ({
      ...event,
      maxConcurrent: groupMaxConcurrent
    }));
  });
}
