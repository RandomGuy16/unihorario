import { SectionSelectionOps } from '../../global/types.ts';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import CourseCardSection from './CourseCardSection.tsx';
import {CourseSection} from "@/app/models/CourseSection";
import {Course} from "@/app/models/Course";
import {CourseColor} from "@/app/utils/CourseCard";


interface CourseCardCheckboxAllProps {
  course: Course;
  colorPair: CourseColor;
  checked: boolean;
  setAllChecked: (val: boolean) => void;
  // allVisible: boolean;
  // setAllVisible: Dispatch<React.SetStateAction<boolean>>;
  sectionOps: SectionSelectionOps;
}
function CourseCardCheckboxAll({ course, colorPair, checked, setAllChecked, sectionOps }: CourseCardCheckboxAllProps) {
  // function to handle the click event of the checkbox
  const handleClick = () => {
    if (!checked) {
      sectionOps.addSections(course.getSections())
      if (course.getSelectedSections().length === 0) sectionOps.trackCourse(course)
      course.selectAllSections()
    }
    else {
      // update the global trackers
      sectionOps.removeSections(course.getSections())
      sectionOps.untrackCourse(course)
      // update the course
      course.unselectAllSections()
    }
    // setChecked runs at last because it takes a moment to update its value
    setAllChecked(!checked)
  }

  return (
    <div className="flex flex-row justify-start items-center">
      <label
        className={
          `py-1 px-2 mr-1 font-normal text-[0.5rem] sm:text-[0.625rem] lg:text-xs duration-100 ease-linear select-none
         rounded-md shadow-lg border`
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
      {/* <button */}
      {/*   onClick={() => { */}
      {/*     course.setAllSectionsVisible(!allVisible) */}
      {/*     setAllVisible(prev => !prev) */}
      {/*   }}> */}
      {/*   {allVisible */}
      {/*     ? <Eye className="w-4 h-4 m-2" style={{ color: colorPair.text }} /> */}
      {/*     : <EyeOff className="w-4 h-4 m-2" style={{ color: colorPair.text }} /> */}
      {/*   } */}
      {/* </button> */}
    </div>
  )
}


interface CourseCardProps {
  course: Course;
  sectionOps: SectionSelectionOps;
  colorPair: CourseColor;
}
/**
 * displays a course in the course list
 * @param course to be displayed
 * @param sectionOps operations to update the global trackers
 * @param colorPair ... colorful
 * @returns a styled div with the course
 */
function CourseCard({ course, sectionOps, colorPair }: CourseCardProps) {
  // state variable to swtich the dropdown menu
  const [isOpen, setIsOpen] = useState(false)

  // set to track locally selected sections (per course)
  const [areAllChecked, setAreAllChecked] = useState(course.areAllSectionsSelected())
  // const [areAllVisible, setAreAllVisible] = useState(!course.areAllSectionsVisible())
  const [isCourseVisible, setIsCourseVisible] = useState(course.getVisibility())

  // manage dark and light theme colors
  const isInitiallyDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // useState to manage text and background colors
  const [textColor, setTextColor] = useState<string>(isInitiallyDark ? colorPair.background : colorPair.text)
  const [bgColor, setBgColor] = useState<string>(isInitiallyDark ? colorPair.text : colorPair.background)

  // handle theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    setTextColor(e.matches ? colorPair.background : colorPair.text)
    setBgColor(e.matches ? colorPair.text : colorPair.background)
  })

  // function to handle the visibility of the course
  const handleCourseVisibility = () => {
    if (isCourseVisible) sectionOps.setCourseInvisible(course)
    else sectionOps.setCourseVisible(course)

    course.setVisibility(!course.getVisibility())
    setIsCourseVisible(!isCourseVisible)
  }

  return (
    <div
      className="
      flex-1 w-full font-normal text-left text-xs lg:text-md my-2 border rounded-md py-2 px-4
      shadow-lg dark:shadow-md dark:shadow-black select-none
      transform transition-all duration-300 ease-in-out"
      id={course.getId()}
      style={{
        backgroundColor: `${bgColor}${isCourseVisible ? "80" : "40"}`,
        color: `${textColor}${isCourseVisible ? "FF" : "AA"}`,
        borderColor: `${textColor}${isCourseVisible ? "FF" : "AA"}`
      }}
    // onMouseOver={() => setIsOpen(true)}
    // onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex flex-row justify-between items-start w-full">
        <div className="flex-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <h3 className="text-sm lg:text-base">{course.getName()}</h3>
          <span className="">créditos: {course.getCredits()}<br />{course.getCareer()}</span>
        </div>
        <div className="flex flex-col justify-center items-center gap-2">
          <button
            className="flex-1"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 mt-2" style={{ color: textColor }} />
            ) : (
              <ChevronRight className="h-4 w-4 mt-2" style={{ color: textColor }} />
            )}
          </button>
          <button className="h-4"
            onClick={() => handleCourseVisibility()}
          >
            {isCourseVisible ? (
              <Eye className="w-4 h-4" style={{ color: textColor }} />
            ) : (
              <EyeOff className="w-4 h-4" style={{ color: textColor }} />
            )}
          </button>
        </div>
      </div>


      {isOpen && (
        <>
          <hr className="mb-2" style={{ borderColor: textColor }} />
          <div className="flex flex-row justify-between items-center mb-1">
            <span className="">Añadir secciones:</span>
            <CourseCardCheckboxAll
              course={course}
              colorPair={{
                background: bgColor,
                text: textColor
              }}
              checked={areAllChecked}
              setAllChecked={setAreAllChecked}
              // allVisible={areAllVisible}
              // setAllVisible={setAreAllVisible}
              sectionOps={sectionOps}>
            </CourseCardCheckboxAll>
          </div>
          <div
            className="
          flex flex-col justify-start items-center mt-1 w-full overflow-x-auto scrollbar-thin
          scrollbar-thumb-gray-300/50 scrollbar-track-gray-100/100 dark:scrollbar-thumb-gray-700/50 dark:scrollbar-track-gray-800/100">
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
                // setAllVisible={setAreAllVisible}
                section={section}
                sectionOps={sectionOps}>
              </CourseCardSection>
            )}
          </div>
        </>)}
    </div>
  )
}

export default CourseCard;

