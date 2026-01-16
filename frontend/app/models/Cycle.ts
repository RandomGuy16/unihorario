import {CourseSection} from "@/app/models/CourseSection";

export interface Cycle {
  cycle: string;
  courseSections: CourseSection[];
}