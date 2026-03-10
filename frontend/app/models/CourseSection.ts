import { Schedule } from "@/app/models/Schedule";
import {
  Assignment,
  AssignmentId,
  CourseVisibility,
  Credits,
  MaxStudents,
  SectionNumber,
  Teacher
} from "@/app/models/types";

export interface CourseSection {
  assignment   : Assignment;
  assignmentId : AssignmentId;
  sectionNumber: SectionNumber;
  teacher      : Teacher;
  schedules    : Schedule[];
  credits      : Credits;
  maxStudents  : MaxStudents;
  courseVisible: CourseVisibility;  // its parent course visibility
  isPreviewHovered    : boolean;  // new parameter to allow hovering a course section and see its schedules in the grid
}
