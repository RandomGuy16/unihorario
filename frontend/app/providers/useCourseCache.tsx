"use client"
import { createContext, ReactNode, useContext, useMemo, useEffect, useState } from "react"
import { useCredits } from "@/app/providers/useCredits"
import { Course } from "@/app/models/Course"
import { CourseSection } from "@/app/models/CourseSection"
import { useCurriculum } from "@/app/providers/useCurriculum";
import { SelectedFilters } from "@/app/models/SelectedFilters";
import { CourseId } from "@/app/models/types";


export function generateCourseKey(year: string | number, id: string, name: string, career: string): string {
  return `${year}-${id}-${name}-${career}`;
}

// Global interface for trackers selection operations
export interface SectionSelectionOps {
  addSections: (sections: CourseSection | CourseSection[], course: Course) => void;
  removeSections: (sections: CourseSection | CourseSection[], course: Course) => void;
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
  selectedCoursesCount: number;
  getCourseInstance: (courseKey: string) => Course | undefined;
}

const CourseCacheContext = createContext<CourseCacheContextType | undefined>(undefined)

export function CourseCacheContextProvider({ children }: { children: ReactNode }) {
  const { courseRegistry } = useCurriculum()
  const { addCredits, resetCredits } = useCredits()
  const [allCourses, setAllCourses] = useState<Map<string, Course>>(() => courseRegistry || new Map<string, Course>())
  const [selectedSections, setSelectedSections] = useState<Set<CourseSection>>(new Set())
  const [visibleSections, setVisibleSections] = useState<Set<CourseSection>>(new Set())

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

  // Helper functions to update maps/sets (trigger React state)
  const updateCourses = (updater: (prev: Map<string, Course>) => Map<string, Course>) => {
    setAllCourses((prev) => updater(new Map(prev)));
  }
  const updateSelectedSections = (updater: (prev: Set<CourseSection>) => Set<CourseSection>) => {
    setSelectedSections((prev) => updater(new Set(prev)));
  }
  const updateVisibleSections = (updater: (prev: Set<CourseSection>) => Set<CourseSection>) => {
    setVisibleSections((prev) => updater(new Set(prev)));
  }

  const selectedCoursesCount = useMemo(() => {
    let count = 0
    allCourses.forEach(course => {
      if (!course.areAllSectionsUnselected()) count++
    })
    return count
  }, [allCourses])

  // useEffect block that updates the courses when the registry changes
  useEffect(() => {
    if (courseRegistry && courseRegistry.size > 0) {
      // console.log("CourseCacheContextProvider: Updating courses from registry")
      // this function instead of replacing the current map of courses, extends it
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

  const getCourseByFilters = (filters: SelectedFilters): Course[] => {
    // get all CourseIds necessary
    const byCareer   : Set<CourseId> = coursesByCareer.get(filters.career) ?? new Set<CourseId>()
    const byCycle    : Set<CourseId> = coursesByCycle.get(filters.cycle) ?? new Set<CourseId>()
    const byStudyPlan: Set<CourseId> = coursesByStudyPlan.get(filters.year) ?? new Set<CourseId>()
    // intersect all sets to get the courses
    const byTriplet = byCareer.intersection(byCycle).intersection(byStudyPlan)
    return Array.from(byTriplet).map(
      (courseId: CourseId) => allCourses.get(courseId)!
    )
  }

  // add a course
  const _addCourse = (course: Course) => {
    // the keys of the courses have this structure
    const courseKey = generateCourseKey(
      course.getStudyPlan(),
      course.getId(),
      course.getName(),
      course.getSchool()
    )
    console.log(allCourses)
    // if hasn't been added yet, add it
    if (!allCourses.has(courseKey)) {
      updateCourses((prev) => prev.set(courseKey, course))
      addCredits(course.getCredits())
    }
  }

  // add a section
  const addSections = (sections: CourseSection | CourseSection[], course: Course) => {
    sections = Array.isArray(sections) ? sections : [sections]
    if (course.areAllSectionsUnselected()) _addCourse(course)

    // set both sections tracker
    sections.forEach(section => {
      course.selectSection(section)
    })
    updateSelectedSections((prev) => {
      sections.forEach(section => prev.add(section))
      return prev
    })
    updateVisibleSections((prev) => {
      sections.forEach(section => {
        if (section.courseVisible) prev.add(section)
      })
      return prev
    })
  }

  // remove a section from both the selected and visible sections
  const removeSections = (sections: CourseSection | CourseSection[], course: Course) => {
    sections = Array.isArray(sections) ? sections : [sections]

    sections.forEach(section => {
      course.unselectSection(section)
    })
    updateSelectedSections(prev => {
      sections.forEach(section => prev.delete(section))
      return prev
    })
    updateVisibleSections(prev => {
      sections.forEach(section => prev.delete(section))
      return prev
    })
  }

  const isSectionSelected = (section: CourseSection) => {
    return selectedSections.has(section)
  }

  const clearSections = () => {
    allCourses.forEach((course: Course) => {
      course.unselectAllSections()
    })
    // empty the sections render list
    setVisibleSections(new Set())
    setSelectedSections(new Set())
    resetCredits()
  }

  // functions to set the visibility of courses
  const setCourseInvisible = (course: Course) => {
    updateVisibleSections(prev => {
      course.getSections().forEach((section: CourseSection) => {
        prev.delete(section)
      })
      return prev
    })

    course.setVisibility(false)
  }
  const setCourseVisible = (course: Course) => {
    updateVisibleSections(prev => {
      course.getSections().forEach((section: CourseSection) => {
        if (isSectionSelected(section)) prev.add(section)
      })
      return prev
    })
    course.setVisibility(true)
  }

  return (
    <CourseCacheContext.Provider value={{
      allCourses: allCourses,
      selectedSections: selectedSections,
      visibleSections: visibleSections,
      selectedCoursesCount: selectedCoursesCount,
      getCourseInstance: getCourseInstance,
      setCourseVisible: setCourseVisible,
      setCourseInvisible: setCourseInvisible,
      addSections: addSections,
      removeSections: removeSections,
      hasSection: isSectionSelected,
      clearSections: clearSections,
      getCoursesByFilters: getCourseByFilters
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
