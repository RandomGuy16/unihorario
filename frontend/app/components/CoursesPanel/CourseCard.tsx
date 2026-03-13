import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react'
import CourseCardSection from '@/app/components/CoursesPanel/CourseCardSection';
import { CourseSection } from "@/app/models/CourseSection";
import { Course } from "@/app/models/Course";
import { CourseColor } from "@/app/utils/CourseCard";
import { useTheme } from "@/app/providers/useTheme";
import { useCourseCache } from "@/app/providers/useCourseCache";
import { CourseCardAllSectionsCheckbox } from "@/app/components/CoursesPanel/CourseCardAllSectionsCheckbox";


interface CourseCardProps {
  course: Course;
  colorPair: CourseColor;
}
/**
 * displays a course in the course list
 * @param course to be displayed
 * @param sectionOps operations to update the global trackers
 * @param colorPair ... colorful
 * @returns a styled div with the course
 */
function CourseCard({ course, colorPair }: CourseCardProps) {
  const { theme } = useTheme()
  const { setCourseInvisible, setCourseVisible, selectedSections, visibleCourses } = useCourseCache()

  // state variable to switch the dropdown menu
  const [isOpen, setIsOpen] = useState(false)

  // set to track locally selected sections (per course)
  const isCourseVisible = useMemo(() => {
    return visibleCourses.has(course.getKey())
  }, [visibleCourses, course])

  const areAllChecked = course.getSections().every(section => selectedSections.has(section))

  const textColor = theme === 'dark'
    ? `${colorPair.background}${isCourseVisible ? "FF" : "AA"}`
    : `${colorPair.text}${isCourseVisible ? "FF" : "AA"}`
  const bgColor = theme === 'dark'
    ? `${colorPair.text}${isCourseVisible ? "FF" : "AA"}`
    : `${colorPair.background}${isCourseVisible ? "FF" : "AA"}`

  // function to handle the visibility of the course
  const handleCourseVisibility = () => {
    if (isCourseVisible) setCourseInvisible(course.getKey())
    else setCourseVisible(course.getKey())
  }

  return (
    <div
      className="
      flex-1 w-full text-left text-body border rounded-md py-2 px-4
      shadow-elev-2 select-none
      transform transition-all duration-300 ease-in-out"
      id={course.getId()}
      style={{
        backgroundColor: bgColor, // `${bgColor}${isCourseVisible ? "80" : "40"}`,
        color: textColor, //`${textColor}${isCourseVisible ? "FF" : "AA"}`,
        borderColor: textColor //`${textColor}${isCourseVisible ? "FF" : "AA"}`
      }}
    >
      <div className="flex flex-row justify-between items-start w-full cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex-1" >
          <h3 className="text-label lg:text-label">{course.getName()}</h3>
          <span className="">créditos: {course.getCredits()}<br />{course.getSchool()}</span>
        </div>
        <div className="flex flex-col justify-center items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 mt-2" style={{ color: textColor }} />
          ) : (
            <ChevronRight className="h-4 w-4 mt-2" style={{ color: textColor }} />
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {/* This maps the sections so we can click them */}
        {isOpen && (<motion.div
          key="coursecard-sections"
          initial={{opacity: 0, height: 0, y: -6}}
          animate={{opacity: 1, height: "auto", y: 0}}
          exit={{opacity: 0, height: 0, y: -6}}
          transition={{duration: 0.2, ease: "easeOut"}}
          className="w-full overflow-hidden"
        >
          <hr className="mb-2" style={{ borderColor: textColor }} />
          <div className="flex flex-row justify-between items-center mb-1">
            <div className='flex flex-row items-center gap-1'>
              <span>Añadir secciones:</span>
              <CourseCardAllSectionsCheckbox
                course={course}
                colorPair={{
                  background: bgColor,
                  text: textColor
                }}
                checked={areAllChecked}>
              </CourseCardAllSectionsCheckbox>
            </div>
            {/* </button> */}
            <button className="h-4 cursor-pointer"
                    onClick={() => {
                      // e.stopPropagation()
                      handleCourseVisibility()
                    }}
            >
              {isCourseVisible ? (
                <Eye className="w-4 h-4" style={{ color: textColor }} />
              ) : (
                <EyeOff className="w-4 h-4" style={{ color: textColor }} />
              )}
            </button>
          </div>
          <div
            className="
        flex flex-col justify-start items-center mt-1 w-full overflow-x-auto scrollbar-thin
        scrollbar-thumb-border scrollbar-track-surface-muted">
            {/* creates a button for every group in classGroups */}
            {course.getSections().map((section: CourseSection, index: number) =>
              <CourseCardSection
                key={`CourseItemButton: ${index}` + section.sectionNumber}
                colorPair={{
                  background: bgColor,
                  text: textColor
                }}
                section={section}>
              </CourseCardSection>
            )}
          </div>
        </motion.div>)
        }
      </AnimatePresence>
    </div >
  )
}

export default CourseCard;
