import { CourseSection } from "@/app/models/CourseSection";
import { Course } from "@/app/models/Course";
import { CourseColor } from "@/app/utils/CourseCard";
import { useCourseCache } from "@/app/contexts/useCourseCache";
import { Eye, EyeOff } from 'lucide-react'
import { useState } from "react";


/*
 * Properties for the 2 kinds of course checkboxes
 * */
interface CourseCardCheckboxProps {
  course: Course;
  section: CourseSection;
  colorPair: CourseColor;
  checked: boolean;
  setAllChecked: (val: boolean) => void;
}

export default function CourseCardSection({ course, section, colorPair, checked, setAllChecked }: CourseCardCheckboxProps) {
  const [visible, setVisible] = useState<boolean>(section.courseVisible)
  const { addSections, removeSections, visibleSections } = useCourseCache()
  // function to handle the click event of the checkbox
  const handleClick = () => {
    // if is not checkt: not added -> add the course now
    if (!checked) {
      // update global trackers
      addSections(section, course)
      // update course
      course.selectSection(section)
    }
    else {
      removeSections(section, course)
      course.unselectSection(section)
    }
    // trigger the re-render of the course card
    setAllChecked(course.areAllSectionsSelected())
  }

  // valuable comment: checked is the local state of the checkbox, initialized in the course object
  return (
    <div
      key={``}
      className='w-full flex flex-row justify-between items-center py-1 px-2 mt-1 font-normal text-micro sm:text-caption lg:text-body duration-100 ease-linear select-none
      rounded-md shadow-elev-1 border'
      style={{
        borderColor: colorPair.text,
        color: `${checked ? colorPair.background : colorPair.text}`,
        backgroundColor: `${checked ? colorPair.text : colorPair.background}`
      }}>
      {/* Label element to display section data and add it to the calendar on click */}
      <label className='flex-1'>
        <input
          className="hidden"
          type="checkbox"
          checked={checked}
          onChange={handleClick}
        />
        <div>
          Secci&oacute;n {section.sectionNumber}<br />Profesor: {section.teacher}<br />Tope de alumnos: {section.maxStudents}
          {section.schedules.map((schedule, index) => (
            <span
              key={`${index} ${schedule.scheduleNumber}`}>
              <br />
              {schedule.day} {schedule.start} - {schedule.end}
            </span>
          ))}
        </div>
      </label>
      Eye button to set its visibility on/off
      <button onClick={() => {
        setVisible(prev => {
          if (prev) visibleSections.delete(section)
          else visibleSections.add(section)
          return !prev
        })
      }}>
        {
          visible
          ? <Eye className="w-4 h-4 m-2" style={{ color: `${checked ? colorPair.background : colorPair.text}` }} />
          : <EyeOff className="w-4 h-4 m-2" style={{ color: `${checked ? colorPair.background : colorPair.text}` }} />
        }
     </button>
    </div>
  )
}
