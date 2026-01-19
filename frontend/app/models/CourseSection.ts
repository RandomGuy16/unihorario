import { Schedule } from "@/app/models/Schedule";

export interface CourseSection {
  assignment: string;
  assignmentId: string;
  sectionNumber: number | string;
  teacher: string;
  schedules: Schedule[];
  credits: number;
  maxStudents: string;
  courseVisible: boolean;  // its parent course visibility
}
