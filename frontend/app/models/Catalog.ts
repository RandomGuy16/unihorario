

export interface CareerCatalogData {
  studyPlans: string[];
  cycles: string[];
  faculty: string;
  career: string;
}

export interface Catalog {
  careers: Record<string, CareerCatalogData>
}