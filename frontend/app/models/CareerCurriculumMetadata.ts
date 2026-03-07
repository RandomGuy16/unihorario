import { AcademicPeriod, DatePrinted, Faculty, School, Specialization, StudyPlan } from "@/app/models/types";


export interface CareerCurriculumMetadata {
  faculty: Faculty;
  school: School;
  specialization: Specialization;
  studyPlan: StudyPlan;
  academicPeriod: AcademicPeriod;
  datePrinted: DatePrinted;
}