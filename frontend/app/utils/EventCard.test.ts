import { describe, expect, it } from "vitest";
import { Schedule } from "@/app/models/Schedule";
import { calculateECPosition, REM_HEIGHT_PER_HOUR } from "@/app/utils/EventCard";

function makeSchedule(overrides: Partial<Schedule>): Schedule {
  return {
    assignment: "Course",
    assignmentId: "1",
    day: "LUNES",
    start: "08:00",
    end: "10:00",
    type: "TEORIA",
    scheduleNumber: 1,
    sectionNumber: 1,
    teacher: "Teacher",
    ...overrides
  };
}

describe("calculateECPosition", () => {
  it("computes top and height from start/end hours", () => {
    const style = calculateECPosition(makeSchedule({ start: "09:00", end: "11:00" }), 0, 1);

    expect(style.top).toBe(`${REM_HEIGHT_PER_HOUR}rem`);
    expect(style.height).toBe(`${2 * REM_HEIGHT_PER_HOUR}rem`);
    expect(style.left).toBe("0%");
    expect(style.width).toBe("100%");
  });

  it("uses lane and maxConcurrent for width and left offsets", () => {
    const style = calculateECPosition(makeSchedule({ start: "10:00", end: "12:00" }), 1, 3);

    expect(parseFloat(style.width)).toBeCloseTo(33.333, 2);
    expect(parseFloat(style.left)).toBeCloseTo(33.333, 2);
  });

  it("guards against invalid maxConcurrent values", () => {
    const style = calculateECPosition(makeSchedule({ start: "10:00", end: "11:00" }), 0, 0);
    expect(style.width).toBe("100%");
  });
});
