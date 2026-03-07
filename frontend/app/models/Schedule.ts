import {
  Assignment,
  AssignmentId,
  Day,
  SchEndTime,
  SchNumber,
  SchStartTime,
  SchType,
  SectionNumber, Teacher
} from "@/app/models/types";

export interface Schedule {
  assignment    : Assignment;
  assignmentId  : AssignmentId;
  day           : Day;
  start         : SchStartTime;
  end           : SchEndTime;
  type          : SchType;
  scheduleNumber: SchNumber;
  sectionNumber : SectionNumber;
  teacher       : Teacher;
}