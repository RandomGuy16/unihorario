import { Cycle } from "@/app/models/Cycle";
import { CareerCurriculumMetadata } from "@/app/models/CareerCurriculumMetadata";

export interface Career {
  metadata: CareerCurriculumMetadata;
  cycles: Cycle[];
}