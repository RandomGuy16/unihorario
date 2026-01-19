"use client"
import { createContext, ReactNode, useContext, useMemo, useEffect, useState } from "react"
import { useCredits } from "@/app/contexts/useCredits"
import { Course } from "@/app/models/Course"
import { CourseSection } from "@/app/models/CourseSection"
import { useCurriculum } from "@/app/reducers/useCurriculum";


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
  addCourse: (course: Course) => void;
  removeCourse: (course: Course) => void;
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
  const { addCredits, restCredits, resetCredits } = useCredits()
  const [allCourses, setAllCourses] = useState<Map<string, Course>>(() => courseRegistry || new Map<string, Course>())
  const [selectedSections, setSelectedSections] = useState<Set<CourseSection>>(new Set())
  const [visibleSections, setVisibleSections] = useState<Set<CourseSection>>(new Set())

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

  useEffect(() => {
    if (courseRegistry && courseRegistry.size > 0) {
      console.log("CourseCacheContextProvider: Updating courses from registry")
      setAllCourses(courseRegistry)
    }
  }, [courseRegistry])

  const getCourseInstance = (courseKey: string): Course | undefined => {
    return allCourses.get(courseKey)
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

  // remove a course
  const _removeCourse = (course: Course) => {
    const courseKey = generateCourseKey(
      course.getStudyPlan(),
      course.getId(),
      course.getName(),
      course.getSchool()
    )

    if (allCourses.has(courseKey)) {
      updateCourses((prev) => {
        const temp = new Map(prev)
        temp.delete(courseKey)
        return temp
      })
      allCourses.delete(courseKey)
      restCredits(course.getCredits())
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

    // if (course.areAllSectionsUnselected()) {
    //   _removeCourse(course)
    // }
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
      addCourse: _addCourse,
      removeCourse: _removeCourse,
      addSections: addSections,
      removeSections: removeSections,
      hasSection: isSectionSelected,
      clearSections: clearSections
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
