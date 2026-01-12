import {Course} from "@/app/models/Course";
import {CourseSection} from "@/app/models/CourseSection";



export function createCourseKey(input: SectionAndCareer | Course): string {
  if (input instanceof Course) return `${input.getYear()}-${input.getId()}-${input.getName()}-${input.getCareer()}`
  else return `${input.section.year}-${input.section.assignmentId}-${input.section.assignment}-${input.career}`
}

interface SectionAndCareer {
  section: CourseSection;
  career: string;
}
