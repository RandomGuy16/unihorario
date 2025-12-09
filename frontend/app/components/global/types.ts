import {CourseSection} from "@/app/models/CourseSection";
import {Career} from "@/app/models/Career";
import {Course} from "@/app/models/Course";


// These interfaces help filter course
// FilterChooser gets data from the webpage and outputs it to Filters
export interface FilterChooser {
  years: string[];
  cycles: string[];
  careers: string[];
}

export interface Filters {
  year: string;
  cycle: string;
  career: string;
}

// interface used by SearchFilter in CourseList.tsx and SearchFilter.tsx
export interface SelectFilterOption {
  label: string;
  value: Career[];
}

// Global interface for trackers selection operations
export interface SectionSelectionOps {
  addSections: (sections: CourseSection | CourseSection[]) => void;
  removeSections: (sections: CourseSection | CourseSection[]) => void;
  hasSection: (section: CourseSection) => boolean;
  clearSections: () => void;
  setCourseVisible: (course: Course) => void;
  setCourseInvisible: (course: Course) => void;
  trackCourse: (course: Course) => void;
  untrackCourse: (course: Course) => void;
}


interface SectionAndCareer {
  section: CourseSection;
  career: string;
}

export function createCourseKey(input: SectionAndCareer | Course): string {
  if (input instanceof Course) return `${input.getYear()} ${input.getId()} ${input.getName()} ${input.getCareer()}`
  else return `${input.section.year} ${input.section.assignmentId} ${input.section.assignment} ${input.career}`
}


export function getCourseKey(course: Course): string {
  return `${course.getYear()} ${course.getId()} ${course.getName()} ${course.getCareer()}`
}

