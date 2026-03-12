import { Schedule } from "@/app/models/Schedule";
import {
  Assignment,
  AssignmentId,
  Credits,
  MaxStudents,
  SectionNumber,
  Teacher
} from "@/app/models/types";

export interface CourseSection {
  assignment      : Assignment;
  assignmentId    : AssignmentId;
  sectionNumber   : SectionNumber;
  teacher         : Teacher;
  schedules       : Schedule[];
  credits         : Credits;
  maxStudents     : MaxStudents;
  courseKey       : string;
}
