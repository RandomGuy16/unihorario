import { CareerCurriculumMetadata } from "@/app/models/CareerCurriculumMetadata";


export interface SubmitCurriculumResponse {
  success: boolean;
  metadata: CareerCurriculumMetadata;
}