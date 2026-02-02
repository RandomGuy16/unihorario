import { CareerCurriculumMetadata } from "@/app/models/CareerCurriculumMetadata";


export interface SubmitCurriculumResponse {
  success                : boolean;
  metadata               : CareerCurriculumMetadata;
  curriculumCreationJobId: string;
  catalogRefreshJobId    : string;
}

export interface AwaitJobResponse<T> {
  success: boolean;
  result : T;
}