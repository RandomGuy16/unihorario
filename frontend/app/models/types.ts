

export type Semester = string;
export type CourseId = string;

// metadata type aliases
export type Faculty = string;
export type School = string;
export type Specialization = string;
export type StudyPlan = string;
export type AcademicPeriod = string;
export type DatePrinted = string;

// course type aliases
export type Assignment = string;
export type AssignmentId = string;
export type SectionNumber = number;
export type Credits = number;
export type MaxStudents = string;  // sometimes this is missing, so better if it's a string
export type CourseVisibility = boolean;

// schedules type aliases
export type Day = string;
export type SchStartTime = string;
export type SchEndTime = string;
export type SchType = string;
export type SchNumber = number;
export type Teacher = string;