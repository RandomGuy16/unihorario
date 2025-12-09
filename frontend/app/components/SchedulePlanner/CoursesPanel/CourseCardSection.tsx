import { SectionSelectionOps } from '../../global/types.ts'
import {CourseSection} from "@/app/models/CourseSection";
import {Course} from "@/app/models/Course";
import {CourseColor} from "@/app/utils/CourseCard";
// import { Eye, EyeOff } from 'lucide-react'


/*
 * Properties for the 2 kinds of course checkboxes
 * */
interface CourseCardCheckboxProps {
  course: Course;
  section: CourseSection;
  colorPair: CourseColor;
  checked: boolean;
  setAllChecked: (val: boolean) => void;
  // setAllVisible: Dispatch<React.SetStateAction<boolean>>;
  sectionOps: SectionSelectionOps;
}

export default function CourseCardSection({ course, section, colorPair, checked, setAllChecked, sectionOps }: CourseCardCheckboxProps) {
  // function to handle the click event of the checkbox
  const handleClick = () => {
    // if is not checkt: not added -> add the course now
    if (!checked) {
      // update global trackers
      sectionOps.addSections(section)
      if (course.getSelectedSections().length === 0) sectionOps.trackCourse(course)
      // update course
      course.selectSection(section)
    }
    else {
      sectionOps.removeSections(section)
      course.unselectSection(section)
      if (course.getSelectedSections().length === 0) sectionOps.untrackCourse(course)
    }
    // trigger the re-render of the course card
    setAllChecked(course.areAllSectionsSelected())
  }

  // function to handle the visibility click event of the eye button
  // const handleVisibilityClick = () => {
  //   // if previously visible, remove it from the calendar, otherwise add it
  //   section.visible
  //     ? sectionOps.setSectionInvisible(section)
  //     : sectionOps.setSectionVisible(section)
  //
  //   // at the and switch the visibility state
  //   setVisible(section.visible)
  // }

  // const [visible, setVisible] = useState<boolean>(section.visible)
  // valuable comment: checked is the local state of the checkbox, initialized in the course object
  return (
    <div
      key={``}
      className='w-full flex flex-row justify-between items-center py-1 px-2 mt-1 font-normal text-[0.5rem] sm:text-[0.625rem] lg:text-xs duration-100 ease-linear select-none
      rounded-md shadow-lg border'
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
              key={`${index} ${schedule.scheduleNumber}`}
              className="text-[0.5rem] sm:text-[0.625rem] lg:text-xs">
              <br />
              {schedule.day} {schedule.start} - {schedule.end}
            </span>
          ))}
        </div>
      </label>
      {/* Eye button to set its visibility on/off */}
      {/* <button onClick={handleVisibilityClick}> */}
      {/*   {visible */}
      {/*     ? <Eye className="w-4 h-4 m-2" style={{ color: `${checked ? colorPair.background : colorPair.text}` }} /> */}
      {/*     : <EyeOff className="w-4 h-4 m-2" style={{ color: `${checked ? colorPair.background : colorPair.text}` }} /> */}
      {/*   } */}
      {/* </button> */}
    </div>
  )
}
