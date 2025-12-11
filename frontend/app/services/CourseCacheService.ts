import {Course} from "@/app/models/Course";
import {CreditsContextType} from "@/app/contexts/useCredits";
import {CourseSection} from "@/app/models/CourseSection";

export function getCourseKey(course: Course): string {
  return `${course.getYear()}-${course.getId()}-${course.getName()}-${course.getCareer()}`
}

export default class CourseCacheService {
  private courses: Map<string, Course> = new Map()
  private selectedSections: Set<CourseSection> = new Set()
  private visibleSections: Set<CourseSection> = new Set()

  private addCredits: (credits: number) => void
  private restCredits: (credits: number) => void
  private resetCredits: () => void

  private generateCourseKey(course: Course): string {
    return `${course.getYear()}-${course.getId()}-${course.getName()}-${course.getCareer()}`
  }

  constructor() {
  }

  setCreditsOps(useCredits: CreditsContextType) {
    this.addCredits = useCredits.addCredits
    this.restCredits = useCredits.restCredits
    this.resetCredits = useCredits.resetCredits
  }

  // add a course
  private addCourse(course: Course) {
    // the keys of the courses have this structure
    const courseKey = this.generateCourseKey(course)
    // if is already added, do not add it again
    if (this.courses.has(courseKey)) return

    this.courses.set(courseKey, course)

    // update credits
    this.addCredits(course.getCredits())
  }

  // remove a course
  private removeCourse (course: Course) {
    const courseKey = this.generateCourseKey(course)
    if (!this.courses.has(courseKey)) return

    this.courses.delete(courseKey)
    this.restCredits(course.getCredits())
  }

  // add a section
  addSections (sections: CourseSection | CourseSection[], course: Course) {
    sections = Array.isArray(sections) ? sections : [sections]

    if (course.getSelectedSections().length === 0) this.addCourse(course)
    // set both sections tracker
    sections.forEach(section => {
      course.selectSection(section)
      this.selectedSections.add(section)
      if (section.courseVisible) this.visibleSections.add(section)
    })
  }
  // remove a section from both the selected and visible sections
  removeSections (sections: CourseSection | CourseSection[], course: Course) {
    sections = Array.isArray(sections) ? sections : [sections]
    sections.forEach(section => {
      course.unselectSection(section)
      this.selectedSections.delete(section)
      this.visibleSections.delete(section)
    })
    if (course.getSelectedSections().length === 0) this.removeCourse(course)
  }

  isSectionSelected (section: CourseSection) {
    return this.selectedSections.has(section)
  }

  clearTrackers () {
    this.courses.forEach((course: Course) => {
      course.unselectAllSections()
    })
    // empty the sections render list
    this.visibleSections.clear()
    this.selectedSections.clear()
    this.courses.clear()
    this.resetCredits()
  }

  // functions to set the visibility of courses
  setCourseInvisible (course: Course) {
    course.getSections().forEach((section: CourseSection) => {
      this.visibleSections.delete(section)
    })
  }
  setCourseVisible (course: Course) {
    course.getSections().forEach((section: CourseSection) => {
      if (this.isSectionSelected(section)) {
        this.visibleSections.add(section)
      }
    })
  }
}


export function createCourseKey(input: SectionAndCareer | Course): string {
  if (input instanceof Course) return `${input.getYear()}-${input.getId()}-${input.getName()}-${input.getCareer()}`
  else return `${input.section.year}-${input.section.assignmentId}-${input.section.assignment}-${input.career}`
}

interface SectionAndCareer {
  section: CourseSection;
  career: string;
}

// Global interface for trackers selection operations
export interface SectionSelectionOps {
  addSections: (sections: CourseSection | CourseSection[]) => void;
  removeSections: (sections: CourseSection | CourseSection[]) => void;
  hasSection: (section: CourseSection) => boolean;
  clearSections: () => void;
  setCourseVisible: (course: Course) => void;
  setCourseInvisible: (course: Course) => void;
  trackCourse: (course: Course) => void;
  untrackCourse: (course: Course) => void;
}