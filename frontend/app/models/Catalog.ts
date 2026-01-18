

export interface CareerCatalogData {
  studyPlans: string[];
  cycles: string[];
  faculty: string;
  career: string;
}

export type Catalog = Record<string, CareerCatalogData>