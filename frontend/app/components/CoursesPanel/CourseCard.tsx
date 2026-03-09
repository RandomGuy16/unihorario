import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import CourseCardSection from '@/app/components/CoursesPanel/CourseCardSection';
import { CourseSection } from "@/app/models/CourseSection";
import { Course } from "@/app/models/Course";
import { CourseColor } from "@/app/utils/CourseCard";
import { useTheme } from "@/app/providers/useTheme";
import { useCourseCache } from "@/app/providers/useCourseCache";


interface CourseCardCheckboxAllProps {
  course: Course;
  colorPair: CourseColor;
  checked: boolean;
  setAllChecked: (val: boolean) => void;
}
function CourseCardCheckboxAll({ course, colorPair, checked, setAllChecked }: CourseCardCheckboxAllProps) {
  const { addSections, removeSections } = useCourseCache()
  // function to handle the click event of the checkbox
  const handleClick = () => {
    if (!checked) {
      addSections(course.getSections(), course)
    }
    else {
      // update the global trackers
      removeSections(course.getSections(), course)
    }
    // setChecked runs at last because it takes a moment to update its value
    setAllChecked(!checked)
  }

  return (
    <div className="flex flex-row justify-start items-center">
      <label
        className={
          `py-1 px-2 mr-1 font-normal text-micro sm:text-caption lg:text-body duration-100 ease-linear select-none
         rounded-md shadow-elev-1 border`
        }
        data-checked={checked}
        style={{
          borderColor: colorPair.text,
          color: `${checked ? colorPair.background : colorPair.text}`,
          backgroundColor: `${checked ? colorPair.text : colorPair.background}`
        }}>
        <input
          className="hidden"
          type="checkbox"
          checked={checked}
          onChange={handleClick} />
        todas
      </label>
    </div>
  )
}


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
  const { setCourseInvisible, setCourseVisible } = useCourseCache()

  // state variable to switch the dropdown menu
  const [isOpen, setIsOpen] = useState(false)

  // set to track locally selected sections (per course)
  const [areAllChecked, setAreAllChecked] = useState(course.areAllSectionsSelected())
  const [isCourseVisible, setIsCourseVisible] = useState(course.getVisibility())

  const textColor = theme === 'dark'
    ? `${colorPair.background}${isCourseVisible ? "FF" : "AA"}`
    : `${colorPair.text}${isCourseVisible ? "FF" : "AA"}`
  const bgColor = theme === 'dark'
    ? `${colorPair.text}${isCourseVisible ? "FF" : "AA"}`
    : `${colorPair.background}${isCourseVisible ? "FF" : "AA"}`

  // function to handle the visibility of the course
  const handleCourseVisibility = () => {
    if (isCourseVisible) setCourseInvisible(course)
    else setCourseVisible(course)

    setIsCourseVisible(!isCourseVisible)
  }

  return (
    <div
      className="
      flex-1 w-full text-left text-body my-2 border rounded-md py-2 px-4
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
          <h3 className="text-label lg:text-title">{course.getName()}</h3>
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

      {/* This maps the sections so we can click them */}
      {isOpen && (
        <>
          <hr className="mb-2" style={{ borderColor: textColor }} />
          <div className="flex flex-row justify-between items-center mb-1">
            <div className='flex flex-row items-center gap-1'>
              <span>Añadir secciones:</span>
              <CourseCardCheckboxAll
                course={course}
                colorPair={{
                  background: bgColor,
                  text: textColor
                }}
                checked={areAllChecked}
                setAllChecked={setAreAllChecked}>
              </CourseCardCheckboxAll>
            </div>
            {/* </button> */}
            <button className="h-4"
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
          scrollbar-thumb-[rgb(var(--color-border))] scrollbar-track-[rgb(var(--color-surface-muted))]">
            {/* creates a button for every group in classGroups */}
            {course.getSections().map((section: CourseSection, index: number) =>
              <CourseCardSection
                key={`CourseItemButton: ${index}` + section.sectionNumber}
                course={course}
                colorPair={{
                  background: bgColor,
                  text: textColor
                }}
                checked={course.isSectionSelected(section) || areAllChecked}
                setAllChecked={setAreAllChecked}
                section={section}>
              </CourseCardSection>
            )}
          </div>
        </>)
      }
    </div >
  )
}

export default CourseCard;
