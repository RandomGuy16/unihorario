// These interfaces help filter course
// FilterChooser gets data from the webpage and outputs it to Filters
import {Career} from "@/app/models/Career";

export interface FilterChooser {
  years: string[];
  cycles: string[];
  careers: string[];
}

export interface Filters {
  year: string;
  cycle: string;
  career: string;
} // interface used by SearchFilter in CourseList.tsx and SearchFilter.tsx
export interface SelectFilterOption {
  label: string;
  value: Career[];
}