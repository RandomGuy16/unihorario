"use client"
import {createContext, ReactNode, useContext, useMemo, useEffect, useState} from "react"
import {useCredits} from "@/app/contexts/useCredits"
import {Course} from "@/app/models/Course"
import {CourseSection} from "@/app/models/CourseSection"
import {useCurriculum} from "@/app/reducers/useCurriculum";


function generateCourseKey(course: Course): string {
  return `${course.getYear()}-${course.getId()}-${course.getName()}-${course.getCareer()}`;
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
  getOrCreateCourse: (courseKey: string, section: CourseSection, career: string) => Course;
  getCourseInstance: (courseKey: string) => Course | undefined;
}

const CourseCacheContext = createContext<CourseCacheContextType | undefined>(undefined)

export function CourseCacheContextProvider({children}: {children: ReactNode}) {
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
      setAllCourses(new Map(courseRegistry))
    }
  }, [courseRegistry])


  const getOrCreateCourse = (courseKey: string, section: CourseSection, career: string): Course => {
    if (allCourses.has(courseKey)) {
      return allCourses.get(courseKey)!
    }

    const newCourse = new Course(
      section.assignmentId,
      section.assignment,
      section.credits,
      section.teacher,
      career,
      section.year
    )

    setAllCourses(prev => {
      const next = new Map(prev)
      next.set(courseKey, newCourse)
      return next
    })

    return newCourse
  }

  const getCourseInstance = (courseKey: string): Course | undefined => {
    return allCourses.get(courseKey)
  }

  // add a course
  const addCourse = (course: Course) => {
    // the keys of the courses have this structure
    const courseKey = generateCourseKey(course)
    // if hasn't been added yet, add it
    if (!allCourses.has(courseKey)) {
      updateCourses((prev) => prev.set(courseKey, course))
      addCredits(course.getCredits())
    }
  }

  // remove a course
  const removeCourse = (course: Course) => {
    const courseKey = generateCourseKey(course)

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
    if (course.areAllSectionsUnselected()) addCourse(course)

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

    if (course.areAllSectionsUnselected()) {
      removeCourse(course)
    }
  }

  const isSectionSelected = (section: CourseSection) => {
    return selectedSections.has(section)
  }

  const clearTrackers = () => {
    allCourses.forEach((course: Course) => {
      course.unselectAllSections()
    })
    // empty the sections render list
    setVisibleSections(new Set())
    setSelectedSections(new Set())
    setAllCourses(new Map())
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
  }
  const setCourseVisible = (course: Course) => {
    updateVisibleSections(prev => {
      course.getSections().forEach((section: CourseSection) => {
        if (isSectionSelected(section)) prev.add(section)
      })
      return prev
    })
  }

  return (
    <CourseCacheContext.Provider value={{
      allCourses: allCourses,
      selectedSections: selectedSections,
      visibleSections: visibleSections,
      selectedCoursesCount: selectedCoursesCount,
      getOrCreateCourse: getOrCreateCourse,
      getCourseInstance: getCourseInstance,
      setCourseVisible: setCourseVisible,
      setCourseInvisible: setCourseInvisible,
      addCourse: addCourse,
      removeCourse: removeCourse,
      addSections: addSections,
      removeSections: removeSections,
      hasSection: isSectionSelected,
      clearSections: clearTrackers
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
