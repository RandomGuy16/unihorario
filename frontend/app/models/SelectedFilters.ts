// These interfaces help filter course
// FilterChooser gets data from the webpage and outputs it to Filters
import {Career} from "@/app/models/Career";

export interface FilterOptions {
  years: string[];
  cycles: string[];
  careers: string[];
}

export interface SelectedFilters {
  year: string;
  cycle: string;
  career: string;
}

// interface used by SearchFilter in CourseList.tsx and SearchFilter.tsx
export interface SelectFilterOption {
  label: string;
  value: Career[];
}