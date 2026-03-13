// @vitest-environment jsdom

import { act, ReactNode, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Course } from "@/app/models/Course";
import { CourseSection } from "@/app/models/CourseSection";
import { Schedule } from "@/app/models/Schedule";
import { SelectedFilters } from "@/app/models/SelectedFilters";
import {
  CourseCacheContextProvider,
  useCourseCache
} from "@/app/providers/useCourseCache";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const addCredits = vi.fn();
const restCredits = vi.fn();
const resetCredits = vi.fn();

let mockCoursesPayload: Map<string, Course> | null = null;
let mockSelection: SelectedFilters = {
  career: "Engineering",
  cycle: "todos",
  year: "todos",
  selected: true,
  visible: true
};
let mockFilterBySelection = false;
let mockFilterByVisibility = false;

vi.mock("@/app/providers/useCredits", () => ({
  useCredits: () => ({
    addCredits,
    restCredits,
    resetCredits
  })
}));

vi.mock("@/app/providers/useCurriculum", () => ({
  useCurriculum: () => ({
    coursesPayload: mockCoursesPayload
  })
}));

vi.mock("@/app/providers/useFilters", () => ({
  useFilters: () => ({
    selection: mockSelection,
    filterBySelection: mockFilterBySelection,
    filterByVisibility: mockFilterByVisibility
  })
}));

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
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

function makeSection(courseKey: string, sectionNumber: number, assignmentId: string): CourseSection {
  return {
    assignment: `Course ${assignmentId}`,
    assignmentId,
    sectionNumber,
    teacher: `Teacher ${assignmentId}`,
    schedules: [makeSchedule({ assignmentId, sectionNumber })],
    credits: 3,
    maxStudents: 40,
    courseKey
  };
}

function makeCourse(params: {
  id: string;
  key: string;
  name: string;
  school: string;
  studyPlan: string;
  cycle: string;
  credits?: number;
  sections: CourseSection[];
}): Course {
  const [firstSection, ...otherSections] = params.sections;
  const course = new Course(
    params.id,
    params.key,
    params.name,
    params.credits ?? 3,
    [firstSection.teacher],
    params.school,
    params.studyPlan,
    params.cycle,
    firstSection
  );

  otherSections.forEach((section) => course.addSection(section));

  return course;
}

function makeFixtureCourses() {
  const calcSections = [
    makeSection("eng-calc", 1, "ENG101"),
    makeSection("eng-calc", 2, "ENG101")
  ];
  const physicsSections = [makeSection("eng-phys", 1, "ENG102")];
  const historySections = [makeSection("arts-hist", 1, "ART201")];

  const calculus = makeCourse({
    id: "ENG101",
    key: "eng-calc",
    name: "Calculus",
    school: "Engineering",
    studyPlan: "2024",
    cycle: "I",
    sections: calcSections
  });
  const physics = makeCourse({
    id: "ENG102",
    key: "eng-phys",
    name: "Physics",
    school: "Engineering",
    studyPlan: "2024",
    cycle: "II",
    sections: physicsSections
  });
  const history = makeCourse({
    id: "ART201",
    key: "arts-hist",
    name: "History",
    school: "Arts",
    studyPlan: "2023",
    cycle: "I",
    sections: historySections
  });

  return {
    calculus,
    physics,
    history,
    calcSections,
    physicsSections,
    historySections,
    coursesPayload: new Map<string, Course>([
      [calculus.getKey(), calculus],
      [physics.getKey(), physics],
      [history.getKey(), history]
    ])
  };
}

let latestContext: ReturnType<typeof useCourseCache> | null = null;
let root: Root | null = null;
let container: HTMLDivElement | null = null;

function Consumer() {
  const context = useCourseCache();

  useEffect(() => {
    latestContext = context;
  }, [context]);

  return null;
}

async function renderProvider(children?: ReactNode) {
  if (!container) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  }

  await act(async () => {
    root!.render(
      <CourseCacheContextProvider>
        {children ?? <Consumer />}
      </CourseCacheContextProvider>
    );
  });
}

async function rerenderProvider() {
  await renderProvider();
}

beforeEach(() => {
  const fixture = makeFixtureCourses();
  mockCoursesPayload = fixture.coursesPayload;
  mockSelection = {
    career: "Engineering",
    cycle: "todos",
    year: "todos",
    selected: true,
    visible: true
  };
  mockFilterBySelection = false;
  mockFilterByVisibility = false;
  latestContext = null;
  addCredits.mockReset();
  restCredits.mockReset();
  resetCredits.mockReset();
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
  }
  root = null;
  if (container) {
    container.remove();
  }
  container = null;
});

describe("useCourseCache", () => {
  it("initializes with fetched courses visible by default", async () => {
    await renderProvider();

    expect(latestContext).not.toBeNull();
    expect(Array.from(latestContext!.visibleCourses)).toEqual([
      "eng-calc",
      "eng-phys",
      "arts-hist"
    ]);
    expect(latestContext!.courseRegistry.size).toBe(3);
    expect(latestContext!.getCourseInstance("eng-calc")?.getName()).toBe("Calculus");
  });

  it("selects and unselects sections while updating credits only on first/last section", async () => {
    const fixture = makeFixtureCourses();
    mockCoursesPayload = fixture.coursesPayload;

    await renderProvider();

    await act(async () => {
      latestContext!.renderSections(fixture.calcSections[0]);
    });
    expect(latestContext!.hasSection(fixture.calcSections[0])).toBe(true);
    expect(latestContext!.selectedSections.has(fixture.calcSections[0])).toBe(true);
    expect(latestContext!.visibleSections.has(fixture.calcSections[0])).toBe(true);
    expect(addCredits).toHaveBeenCalledTimes(1);
    expect(addCredits).toHaveBeenCalledWith(3);

    await act(async () => {
      latestContext!.renderSections(fixture.calcSections[1]);
    });
    expect(addCredits).toHaveBeenCalledTimes(1);
    expect(latestContext!.selectedCoursesCount).toBe(1);

    await act(async () => {
      latestContext!.hideSections(fixture.calcSections[0]);
    });
    expect(restCredits).not.toHaveBeenCalled();
    expect(latestContext!.selectedSections.has(fixture.calcSections[1])).toBe(true);

    await act(async () => {
      latestContext!.hideSections(fixture.calcSections[1]);
    });
    expect(restCredits).toHaveBeenCalledTimes(1);
    expect(restCredits).toHaveBeenCalledWith(3);
    expect(latestContext!.selectedSections.size).toBe(0);
    expect(latestContext!.selectedCoursesCount).toBe(0);
  });

  it("tracks preview sections separately and only exposes them when the course is visible", async () => {
    const fixture = makeFixtureCourses();
    mockCoursesPayload = fixture.coursesPayload;

    await renderProvider();

    await act(async () => {
      latestContext!.renderSections(fixture.physicsSections[0], true);
    });
    expect(latestContext!.previewSections.has(fixture.physicsSections[0])).toBe(true);
    expect(latestContext!.visibleSections.has(fixture.physicsSections[0])).toBe(true);

    await act(async () => {
      latestContext!.setCourseInvisible(fixture.physics.getKey());
    });
    expect(latestContext!.visibleCourses.has(fixture.physics.getKey())).toBe(false);
    expect(latestContext!.previewSections.has(fixture.physicsSections[0])).toBe(true);
    expect(latestContext!.visibleSections.has(fixture.physicsSections[0])).toBe(false);

    await act(async () => {
      latestContext!.hideSections(fixture.physicsSections[0], true);
    });
    expect(latestContext!.previewSections.has(fixture.physicsSections[0])).toBe(false);
  });

  it("clears selected and previewed sections and resets course instances", async () => {
    const fixture = makeFixtureCourses();
    mockCoursesPayload = fixture.coursesPayload;

    await renderProvider();

    await act(async () => {
      latestContext!.renderSections(fixture.calcSections[0]);
      latestContext!.renderSections(fixture.physicsSections[0], true);
    });
    expect(latestContext!.selectedSections.size).toBe(1);
    expect(latestContext!.previewSections.size).toBe(1);
    expect(fixture.calculus.areAllSectionsUnselected()).toBe(false);

    await act(async () => {
      latestContext!.clearSections();
    });
    expect(latestContext!.selectedSections.size).toBe(0);
    expect(latestContext!.previewSections.size).toBe(0);
    expect(resetCredits).toHaveBeenCalledTimes(1);
    expect(fixture.calculus.areAllSectionsUnselected()).toBe(true);
  });

  it("filters courses by career, cycle, study plan, selected state, and visibility", async () => {
    const fixture = makeFixtureCourses();
    mockCoursesPayload = fixture.coursesPayload;

    await renderProvider();

    await act(async () => {
      latestContext!.renderSections(fixture.calcSections[0]);
      latestContext!.setCourseInvisible(fixture.physics.getKey());
    });

    mockSelection = {
      career: "Engineering",
      cycle: "I",
      year: "2024",
      selected: true,
      visible: true
    };
    mockFilterBySelection = true;
    mockFilterByVisibility = true;

    await rerenderProvider();

    const filteredCourseNames = latestContext!.getCoursesByFilters(mockSelection).map((course) => course.getName());
    expect(filteredCourseNames).toEqual(["Calculus"]);
    expect(latestContext!.selectedCoursesCount).toBe(1);

    mockSelection = {
      career: "Engineering",
      cycle: "II",
      year: "2024",
      selected: false,
      visible: false
    };

    await rerenderProvider();

    const hiddenUnselectedCourses = latestContext!.getCoursesByFilters(mockSelection).map((course) => course.getName());
    expect(hiddenUnselectedCourses).toEqual(["Physics"]);
    expect(latestContext!.selectedCoursesCount).toBe(0);
  });

  it("marks courses from later curriculum payload updates as visible by default", async () => {
    const fixture = makeFixtureCourses();
    mockCoursesPayload = new Map<string, Course>([
      [fixture.calculus.getKey(), fixture.calculus]
    ]);

    await renderProvider();
    expect(Array.from(latestContext!.visibleCourses)).toEqual(["eng-calc"]);

    mockCoursesPayload = fixture.coursesPayload;
    await rerenderProvider();

    expect(Array.from(latestContext!.visibleCourses)).toEqual([
      "eng-calc",
      "eng-phys",
      "arts-hist"
    ]);
  });
});
