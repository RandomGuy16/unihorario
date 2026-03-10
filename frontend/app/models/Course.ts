import { CourseSection } from "@/app/models/CourseSection";
import { logger } from "@/app/utils/logger";

export class Course {
  private readonly id: string;
  private readonly name: string;
  private readonly school: string;
  private readonly credits: number;
  private readonly teachers: string[];
  private readonly sections: Set<CourseSection>;
  private readonly studyPlan: string;
  private readonly cycle: string;
  private readonly selectedSections: Set<CourseSection>;
  private visible: boolean = true;

  constructor(id: string, name: string, credits: number, teacher: string[], school: string, studyPlan: string, cycle: string, section?: CourseSection) {
    this.id = id
    this.name = name
    this.credits = credits
    this.teachers = teacher
    this.school = school
    this.sections = new Set()
    this.studyPlan = studyPlan
    this.cycle = cycle
    this.selectedSections = new Set()
    this.visible = true // default visibility is true
    if (section) this.sections.add(section)
  }

  addSection(section: CourseSection) {
    this.sections.add(section)
  }

  hasSection(section: CourseSection): boolean {
    return this.sections.has(section)
  }

  selectSection(section: CourseSection) {
    if (!this.sections.has(section)) {
      logger.warn("Trying to select a section that is not part of the course", {
        courseId: this.id,
        courseName: this.name,
        sectionNumber: section.sectionNumber
      })
    }
    this.selectedSections.add(section)
  }

  selectAllSections() {
    this.sections.forEach(section => this.selectedSections.add(section))
  }

  unselectSection(section: CourseSection) {
    this.selectedSections.delete(section)
  }

  unselectAllSections() {
    this.selectedSections.clear()
  }

  isSectionSelected(section: CourseSection): boolean {
    return this.selectedSections.has(section)
  }

  areAllSectionsSelected(): boolean {
    return this.selectedSections.size === this.sections.size
  }

  areAllSectionsUnselected(): boolean {
    return this.selectedSections.size === 0
  }

  getVisibility(): boolean {
    return this.visible
  }

  setVisibility(visibility: boolean) {
    // change visibility of the course and all its sections
    this.visible = visibility
    this.sections.forEach(section => section.courseVisible = visibility)
  }

  getSections(): CourseSection[] {
    return Array.from(this.sections)
  }

  getSelectedSections(): CourseSection[] {
    return Array.from(this.selectedSections)
  }

  getId(): string {
    return this.id
  }

  getName(): string {
    return this.name
  }

  getCredits(): number {
    return this.credits
  }

  getTeachers(): string[] {
    return this.teachers
  }

  getSchool(): string {
    return this.school
  }

  getCycle(): string {
    return this.cycle
  }

  getStudyPlan(): string {
    return this.studyPlan
  }

}
