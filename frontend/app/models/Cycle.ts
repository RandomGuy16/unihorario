import {CourseSection} from "@/app/models/CourseSection";

export interface Cycle {
  name: string;
  courseSections: CourseSection[];
}