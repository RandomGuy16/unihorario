import { CourseSection } from "@/app/models/CourseSection";
import { Semester } from "@/app/models/types";

export interface Cycle {
  cycle: Semester;
  courseSections: CourseSection[];
}