import { CourseSection } from "@/app/models/CourseSection";
import { Course } from "@/app/models/Course";
import { CourseColor } from "@/app/utils/CourseCard";
import { useCourseCache } from "@/app/contexts/useCourseCache";


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
  // const [visible, setVisible] = useState<boolean>(course.getVisibility())
  const { addSections, removeSections } = useCourseCache()
  // function to handle the click event of the checkbox
  const handleClick = () => {
    // if is not checkt: not added -> add the course now
    if (!checked) addSections(section, course)
    else removeSections(section, course)

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
    </div>
  )
}
