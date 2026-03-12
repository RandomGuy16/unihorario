"use client"
import { createContext, ReactNode, useContext, useMemo, useEffect, useState } from "react"
import { useCredits } from "@/app/providers/useCredits"
import { Course } from "@/app/models/Course"
import { CourseSection } from "@/app/models/CourseSection"
import { useCurriculum } from "@/app/providers/useCurriculum";
import { SelectedFilters } from "@/app/models/SelectedFilters";
import { CourseId } from "@/app/models/types";
import {useFilters} from "@/app/providers/useFilters";


export function generateCourseKey(year: string | number, id: string, name: string, career: string): string {
  return `${year}-${id}-${name}-${career}`;
}

// Global interface for trackers selection operations
export interface SectionSelectionOps {
  renderSections: (sections: CourseSection | CourseSection[], preview?: boolean) => void;
  hideSections: (sections: CourseSection | CourseSection[], preview?: boolean) => void;
  hasSection: (section: CourseSection) => boolean;
  clearSections: () => void;
  setCourseVisible: (course: Course) => void;
  setCourseInvisible: (course: Course) => void;
  getCoursesByFilters: (filters: SelectedFilters) => Course[];
}

interface CourseCacheContextType extends SectionSelectionOps {
  courseRegistry: Map<string, Course>;
  selectedSections: Set<CourseSection>;
  visibleSections: Set<CourseSection>;
  previewSections: Set<CourseSection>;
  selectedCoursesCount: number;
  visibleCourses: Set<CourseId>;
  getCourseInstance: (courseKey: string) => Course | undefined;
}

const CourseCacheContext = createContext<CourseCacheContextType | undefined>(undefined)

export function CourseCacheContextProvider({ children }: { children: ReactNode }) {
  const { coursesPayload } = useCurriculum()
  const { addCredits, restCredits, resetCredits } = useCredits()
  const { selection } = useFilters()
  const [courseRegistry, setCourseRegistry] = useState<Map<string, Course>>(() => coursesPayload || new Map<string, Course>())
  const [visibleCourses, setVisibleCourses] = useState<Set<CourseId>>(new Set())
  const [selectedSections, setSelectedSections] = useState<Set<CourseSection>>(new Set())
  const [previewSections, setPreviewSections] = useState<Set<CourseSection>>(new Set())

  // useEffect block that updates the courses when the registry changes
  useEffect(() => {
    if (coursesPayload && coursesPayload.size > 0) {
      setCourseRegistry(prev => {
        const temp = new Map(prev)
        coursesPayload.forEach((course, key) => {
          if (!temp.has(key)) {
            temp.set(key, course)
          }
        })
        return temp
      })
      // add new courses to visibleCourses
      setVisibleCourses(prev => {
        const temp = new Set(prev)
        coursesPayload.forEach((course, key) => {
          if (!courseRegistry.has(key)) temp.add(key)
        })
        return temp
      })
    }
  }, [coursesPayload])

  const visibleSections: Set<CourseSection> = useMemo(() => {
    const next = new Set<CourseSection>()
    selectedSections.forEach(section => {
      if (visibleCourses.has(section.courseKey)) next.add(section)
    })
    previewSections.forEach(section => {
      if (visibleCourses.has(section.courseKey)) next.add(section)
    })
    return next
  }, [previewSections, selectedSections, visibleCourses])

  // stateful inverted indexes that help with the course render list
  const coursesByCareer = useMemo(() => {
    const map = new Map<string, Set<string>>()
    courseRegistry.forEach((course, key) => {
      const career = course.getSchool()
      if (!map.has(career)) map.set(career, new Set())
      map.get(career)!.add(key)
    })
    return map
  }, [courseRegistry])
  const coursesByStudyPlan = useMemo(() => {
    const map = new Map<string, Set<string>>()
    courseRegistry.forEach((course, key) => {
      const studyPlan = course.getStudyPlan()
      if (!map.has(studyPlan)) map.set(studyPlan, new Set())
      map.get(studyPlan)!.add(key)
    })
    return map
  }, [courseRegistry])
  const coursesByCycle = useMemo(() => {
    const map = new Map<string, Set<string>>()
    courseRegistry.forEach((course, key) => {
      const cycle = course.getCycle()
      if (!map.has(cycle)) map.set(cycle, new Set())
      map.get(cycle)!.add(key)
    })
    return map
  }, [courseRegistry])

  // useMemo hook that reloads the course list each time its parameters change
  const coursesInCourseList = useMemo(() => {
    // get all CourseIds necessary
    const byCareer   : Set<CourseId> = coursesByCareer.get(selection.career) ?? new Set<CourseId>()
    const byCycle    : Set<CourseId> = coursesByCycle.get(selection.cycle) ?? new Set<CourseId>()
    const byStudyPlan: Set<CourseId> = coursesByStudyPlan.get(selection.year) ?? new Set<CourseId>()
    // intersect all sets to get the courses
    const byTriplet = byCareer.intersection(byCycle).intersection(byStudyPlan)
    return Array.from(byTriplet).map(
      (courseId: CourseId) => courseRegistry.get(courseId)!
    )
  }, [courseRegistry, coursesByCareer, coursesByCycle, coursesByStudyPlan, selection])

  // selected courses count
  const selectedCoursesCount = useMemo(() => {
    let count = 0
    coursesInCourseList.forEach((course: Course) => {
      if (!course.areAllSectionsUnselected()) count++
    })
    return count
  }, [coursesInCourseList, selectedSections])

  // Helper functions to update maps/sets (trigger React state)
  const updateSelectedSections = (updater: (prev: Set<CourseSection>) => Set<CourseSection>) => {
    setSelectedSections((prev) => updater(new Set(prev)));
  }

  const getCourseInstance = (courseKey: string): Course | undefined => {
    return courseRegistry.get(courseKey)
  }

  const getCourseList = (): Course[] => { return coursesInCourseList }

  // add a section
  const renderSections = (
    sections: CourseSection | CourseSection[], hover?: boolean
  ) => {
    sections = Array.isArray(sections) ? sections : [sections]
    const course = courseRegistry.get(sections[0].courseKey)!
    // add to the preview sections
    if (hover) {
      setPreviewSections(prev => {
        const temp = new Set(prev)
        sections.forEach(section => {
          if (visibleCourses.has(section.courseKey)) temp.add(section)
        })
        return temp
      })
      return  // and do nothing else
    }
    // if before selecting sections it doesn't have any selected section, add credits
    if (course.areAllSectionsUnselected()) addCredits(course.getCredits())
    // set both sections tracker
    sections.forEach(section => {
      course.selectSection(section)
    })
    updateSelectedSections((prev) => {
      sections.forEach(section => prev.add(section))
      return prev
    })
  }

  // remove a section from both the selected and visible sections
  const hideSections = (
    sections: CourseSection | CourseSection[], hover?: boolean
  ) => {
    sections = Array.isArray(sections) ? sections : [sections]
    const course = courseRegistry.get(sections[0].courseKey)!

    if (hover) {
      // remove from the preview sections
      setPreviewSections(prev => {
        const temp = new Set(prev)
        sections.forEach(section => temp.delete(section))
        return temp
      })
      return  // and do nothing else
    }

    sections.forEach(section => {
      course.unselectSection(section)
    })
    updateSelectedSections(prev => {
      sections.forEach(section => prev.delete(section))
      return prev
    })
    // if after removing all sections they all are unselected, remove credits
    if (course.areAllSectionsUnselected()) restCredits(course.getCredits())
  }

  const isSectionSelected = (section: CourseSection) => {
    return selectedSections.has(section)
  }

  const clearSections = () => {
    courseRegistry.forEach((course: Course) => {
      course.unselectAllSections()
    })
    // empty the sections render list
    setSelectedSections(new Set())
    setPreviewSections(new Set())
    resetCredits()
  }

  // functions to set the visibility of courses
  const setCourseInvisible = (course: Course) => {
    course.setVisibility(false)
    const courseKey = generateCourseKey(
      course.getStudyPlan(),
      course.getId(),
      course.getName(),
      course.getSchool()
    )
    // trigger a re-render with this
    setVisibleCourses(prev => {
      const temp = new Set(prev)
      if (temp.has(courseKey)) temp.delete(courseKey)
      return temp
    })
    updateSelectedSections(prev => prev)
  }
  const setCourseVisible = (course: Course) => {
    course.setVisibility(true)
    const courseKey = generateCourseKey(
      course.getStudyPlan(),
      course.getId(),
      course.getName(),
      course.getSchool()
    )
    // trigger a re-render with this
    setVisibleCourses(prev => {
      const temp = new Set(prev)
      if (!temp.has(courseKey)) temp.add(courseKey)
      return temp
    })
    updateSelectedSections(prev => prev)
  }


  return (
    <CourseCacheContext.Provider value={{
      courseRegistry: courseRegistry,
      selectedSections: selectedSections,
      visibleSections: visibleSections,
      previewSections: previewSections,
      selectedCoursesCount: selectedCoursesCount,
      visibleCourses: visibleCourses,
      getCourseInstance: getCourseInstance,
      setCourseVisible: setCourseVisible,
      setCourseInvisible: setCourseInvisible,
      renderSections: renderSections,
      hideSections: hideSections,
      hasSection: isSectionSelected,
      clearSections: clearSections,
      getCoursesByFilters: getCourseList
    }}>
      {children}
    </CourseCacheContext.Provider>
  )
}

export function useCourseCache() {
  const context = useContext(CourseCacheContext)
  if (context === undefined) {
    throw new Error("useCourseCache must be used within a CourseCacheContextProvider")
  }
  return context
}
