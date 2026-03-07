import { Career } from "@/app/models/Career";
import { StudyPlan } from "@/app/models/types";

export interface Year {
  year: StudyPlan;
  careerCurriculums: Career[];
}