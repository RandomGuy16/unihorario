import {CourseSection} from "@/app/models/CourseSection";

export class Course {
  private readonly id: string;
  private readonly name: string;
  private readonly career: string;
  private readonly credits: number;
  private readonly teacher: string;
  private readonly sections: Set<CourseSection>;
  private readonly year: number;
  private readonly cycle: string;
  private readonly selectedSections: Set<CourseSection>;
  private visible: boolean = true;

  constructor(id: string, name: string, credits: number, teacher: string, career: string, year: number, cycle: string, section?: CourseSection) {
    this.id = id
    this.name = name
    this.credits = credits
    this.teacher = teacher
    this.career = career
    this.sections = new Set()
    this.year = year
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
    if (!this.sections.has(section)) console.warn(
      `Trying to select a section that is not part of the course ${this.name} (${this.id})`
    )
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

  getTeacher(): string {
    return this.teacher
  }

  getCareer(): string {
    return this.career
  }

  getYear(): number {
    return this.year
  }

}