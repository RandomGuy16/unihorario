import { Schedule } from "@/app/models/Schedule";
import {
  buildDayLayouts,
  DAY_START_HOUR,
  getScheduleIdentityValue,
  parseHourIndex,
  ScheduleEventLayout
} from "@/app/utils/scheduleLayout";

function makeSchedule(overrides: Partial<Schedule>): Schedule {
  return {
    assignment: "Course",
    assignmentId: 1,
    day: "LUNES",
    start: "08:00",
    end: "09:00",
    type: "TEORIA",
    scheduleNumber: 1,
    sectionNumber: 1,
    teacher: "Teacher",
    ...overrides
  };
}

describe("scheduleLayout", () => {
  it("parses hour indexes from DAY_START_HOUR", () => {
    expect(parseHourIndex("08:00")).toBe(0);
    expect(parseHourIndex("10:00")).toBe(2);
    expect(parseHourIndex("invalid")).toBe(0);
  });

  it("builds deterministic lanes and max overlap for concurrent events", () => {
    const schedules = [
      makeSchedule({ assignmentId: 1, scheduleNumber: 1, start: "08:00", end: "10:00" }),
      makeSchedule({ assignmentId: 2, scheduleNumber: 1, start: "09:00", end: "11:00" }),
      makeSchedule({ assignmentId: 3, scheduleNumber: 1, start: "09:00", end: "10:00" })
    ];

    const events: ScheduleEventLayout[] = schedules.map((schedule, sectionIndex) => ({
      sectionIndex,
      schedule,
      startHourIndex: parseHourIndex(schedule.start),
      endHourIndex: parseHourIndex(schedule.end),
      laneIndex: 0,
      maxConcurrent: 1
    }));

    const laidOut = buildDayLayouts(events);
    const byIdentity = new Map(laidOut.map((event) => [getScheduleIdentityValue(event.schedule), event]));

    expect(byIdentity.get(getScheduleIdentityValue(schedules[0]))?.laneIndex).toBe(0);
    expect(byIdentity.get(getScheduleIdentityValue(schedules[1]))?.laneIndex).toBe(2);
    expect(byIdentity.get(getScheduleIdentityValue(schedules[2]))?.laneIndex).toBe(1);

    for (const schedule of schedules) {
      expect(byIdentity.get(getScheduleIdentityValue(schedule))?.maxConcurrent).toBe(3);
    }
  });

  it("reuses lanes when events do not overlap", () => {
    const first = makeSchedule({ assignmentId: 10, start: "08:00", end: "09:00" });
    const second = makeSchedule({ assignmentId: 11, start: "09:00", end: "10:00" });

    const events: ScheduleEventLayout[] = [first, second].map((schedule, sectionIndex) => ({
      sectionIndex,
      schedule,
      startHourIndex: parseHourIndex(schedule.start),
      endHourIndex: parseHourIndex(schedule.end),
      laneIndex: 0,
      maxConcurrent: 1
    }));

    const laidOut = buildDayLayouts(events);
    expect(laidOut[0].laneIndex).toBe(0);
    expect(laidOut[1].laneIndex).toBe(0);
    expect(laidOut[0].maxConcurrent).toBe(1);
    expect(laidOut[1].maxConcurrent).toBe(1);
  });

  it("keeps group width for chained overlaps to avoid late overlap clipping", () => {
    // 1: 08-12, 2: 08-10, 3: 08-14, 4: 12-14
    // Event 4 only directly overlaps with event 3, but it is in the same conflict chain.
    const schedules = [
      makeSchedule({ assignmentId: 21, start: "08:00", end: "12:00" }),
      makeSchedule({ assignmentId: 22, start: "08:00", end: "10:00" }),
      makeSchedule({ assignmentId: 23, start: "08:00", end: "14:00" }),
      makeSchedule({ assignmentId: 24, start: "12:00", end: "14:00" })
    ];

    const events: ScheduleEventLayout[] = schedules.map((schedule, sectionIndex) => ({
      sectionIndex,
      schedule,
      startHourIndex: parseHourIndex(schedule.start),
      endHourIndex: parseHourIndex(schedule.end),
      laneIndex: 0,
      maxConcurrent: 1
    }));

    const laidOut = buildDayLayouts(events);
    const byIdentity = new Map(laidOut.map((event) => [getScheduleIdentityValue(event.schedule), event]));

    expect(byIdentity.get(getScheduleIdentityValue(schedules[2]))?.maxConcurrent).toBe(3);
    expect(byIdentity.get(getScheduleIdentityValue(schedules[3]))?.maxConcurrent).toBe(3);
  });

  it("reuses the same lane for separated blocks of the same section when lane is free", () => {
    // section 1: 08-11 and 12-14
    // section 2: 08-10 and 11-14
    // section 3: 08-12
    const s1a = makeSchedule({ assignmentId: 31, sectionNumber: 1, scheduleNumber: 1, start: "08:00", end: "11:00" });
    const s1b = makeSchedule({ assignmentId: 31, sectionNumber: 1, scheduleNumber: 2, start: "12:00", end: "14:00" });
    const s2a = makeSchedule({ assignmentId: 32, sectionNumber: 2, scheduleNumber: 1, start: "08:00", end: "10:00" });
    const s2b = makeSchedule({ assignmentId: 32, sectionNumber: 2, scheduleNumber: 2, start: "11:00", end: "14:00" });
    const s3 = makeSchedule({ assignmentId: 33, sectionNumber: 3, scheduleNumber: 1, start: "08:00", end: "12:00" });

    const schedules = [s1a, s1b, s2a, s2b, s3];
    const sectionIndexes = [0, 0, 1, 1, 2];

    const events: ScheduleEventLayout[] = schedules.map((schedule, index) => ({
      sectionIndex: sectionIndexes[index],
      schedule,
      startHourIndex: parseHourIndex(schedule.start),
      endHourIndex: parseHourIndex(schedule.end),
      laneIndex: 0,
      maxConcurrent: 1
    }));

    const laidOut = buildDayLayouts(events);
    const byIdentity = new Map(laidOut.map((event) => [getScheduleIdentityValue(event.schedule), event]));

    const firstBlockLane = byIdentity.get(getScheduleIdentityValue(s1a))?.laneIndex;
    const secondBlockLane = byIdentity.get(getScheduleIdentityValue(s1b))?.laneIndex;

    expect(firstBlockLane).toBeDefined();
    expect(secondBlockLane).toBeDefined();
    expect(secondBlockLane).toBe(firstBlockLane);
  });
});
