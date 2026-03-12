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
  renderSections: (sections: CourseSection | CourseSection[], course: Course, hover?: boolean) => void;
  hideSections: (sections: CourseSection | CourseSection[], course: Course, hover?: boolean) => void;
  hasSection: (section: CourseSection) => boolean;
  clearSections: () => void;
  setCourseVisible: (course: Course) => void;
  setCourseInvisible: (course: Course) => void;
  getCoursesByFilters: (filters: SelectedFilters) => Course[];
}

interface CourseCacheContextType extends SectionSelectionOps {
  allCourses: Map<string, Course>;
  selectedSections: Set<CourseSection>;
  visibleSections: Set<CourseSection>;
  previewSections: Set<CourseSection>;
  selectedCoursesCount: number;
  getCourseInstance: (courseKey: string) => Course | undefined;
}

const CourseCacheContext = createContext<CourseCacheContextType | undefined>(undefined)

export function CourseCacheContextProvider({ children }: { children: ReactNode }) {
  const { courseRegistry } = useCurriculum()
  const { addCredits, restCredits, resetCredits } = useCredits()
  const { selection } = useFilters()
  const [allCourses, setAllCourses] = useState<Map<string, Course>>(() => courseRegistry || new Map<string, Course>())
  const [selectedSections, setSelectedSections] = useState<Set<CourseSection>>(new Set())
  const [previewSections, setPreviewSections] = useState<Set<CourseSection>>(new Set())

  const visibleSections = useMemo(() => {
    const next = new Set(selectedSections)
    previewSections.forEach(section => {
      if (section.courseVisible) next.add(section)
    })
    return next
  }, [previewSections, selectedSections])

  useEffect(() => {
    console.log(allCourses)
  }, [allCourses])

  // stateful inverted indexes that help with the course render list
  const coursesByCareer = useMemo(() => {
    const map = new Map<string, Set<string>>()
    allCourses.forEach((course, key) => {
      const career = course.getSchool()
      if (!map.has(career)) map.set(career, new Set())
      map.get(career)!.add(key)
    })
    return map
  }, [allCourses])
  const coursesByStudyPlan = useMemo(() => {
    const map = new Map<string, Set<string>>()
    allCourses.forEach((course, key) => {
      const studyPlan = course.getStudyPlan()
      if (!map.has(studyPlan)) map.set(studyPlan, new Set())
      map.get(studyPlan)!.add(key)
    })
    return map
  }, [allCourses])
  const coursesByCycle = useMemo(() => {
    const map = new Map<string, Set<string>>()
    allCourses.forEach((course, key) => {
      const cycle = course.getCycle()
      if (!map.has(cycle)) map.set(cycle, new Set())
      map.get(cycle)!.add(key)
    })
    return map
  }, [allCourses])

  // useMemo hook that reloads the course list each time its parameters change
  const coursesInCourseList = useMemo(() => {
    // get all CourseIds necessary
    const byCareer   : Set<CourseId> = coursesByCareer.get(selection.career) ?? new Set<CourseId>()
    const byCycle    : Set<CourseId> = coursesByCycle.get(selection.cycle) ?? new Set<CourseId>()
    const byStudyPlan: Set<CourseId> = coursesByStudyPlan.get(selection.year) ?? new Set<CourseId>()
    // intersect all sets to get the courses
    const byTriplet = byCareer.intersection(byCycle).intersection(byStudyPlan)
    return Array.from(byTriplet).map(
      (courseId: CourseId) => allCourses.get(courseId)!
    )
  }, [allCourses, coursesByCareer, coursesByCycle, coursesByStudyPlan, selection])

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

  // useEffect block that updates the courses when the registry changes
  useEffect(() => {
    if (courseRegistry && courseRegistry.size > 0) {
      setAllCourses(prev => {
        const temp = new Map(prev)
        courseRegistry.forEach((course, key) => {
          if (!temp.has(key)) {
            temp.set(key, course)
          }
        })
        return temp
      })
    }
  }, [courseRegistry])

  const getCourseInstance = (courseKey: string): Course | undefined => {
    return allCourses.get(courseKey)
  }

  const getCourseList = (): Course[] => { return coursesInCourseList }

  // add a section
  const renderSections = (
    sections: CourseSection | CourseSection[], course: Course, hover?: boolean
  ) => {
    sections = Array.isArray(sections) ? sections : [sections]

    // add to the preview sections
    if (hover) {
      setPreviewSections(prev => {
        const temp = new Set(prev)
        sections.forEach(section => {
          if (section.courseVisible) temp.add(section)
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
    sections: CourseSection | CourseSection[], course: Course, hover?: boolean
  ) => {
    sections = Array.isArray(sections) ? sections : [sections]

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
    allCourses.forEach((course: Course) => {
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
    // trigger a re-render with this
    updateSelectedSections(prev => prev)
  }
  const setCourseVisible = (course: Course) => {
    course.setVisibility(true)
    // trigger a re-render with this
    updateSelectedSections(prev => prev)
  }


  return (
    <CourseCacheContext.Provider value={{
      allCourses: allCourses,
      selectedSections: selectedSections,
      visibleSections: visibleSections,
      previewSections: previewSections,
      selectedCoursesCount: selectedCoursesCount,
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
