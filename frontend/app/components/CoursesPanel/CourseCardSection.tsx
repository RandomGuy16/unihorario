import { CourseSection } from "@/app/models/CourseSection";
import { Course } from "@/app/models/Course";
import { CourseColor } from "@/app/utils/CourseCard";
import { useCourseCache } from "@/app/providers/useCourseCache";


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
  const { renderSections, hideSections, previewSections } = useCourseCache()
  // function to handle the click event of the checkbox
  const handleClick = () => {
    // if is not checked: not added -> add the course now
    if (!checked) renderSections(section, course)
    else hideSections(section, course)

    // trigger the re-render of the course card
    setAllChecked(course.areAllSectionsSelected())
  }

  const handleMouseEnter = () => {
    // just show the sections in a manner that they don't feel already selected
    renderSections(section, course, true)
  }
  const handleMouseLeave = () => {
    // like previously said but inverted
    hideSections(section, course, true)
  }

  const isPreviewed = previewSections.has(section)
  const isPreviewedAndSelected = isPreviewed && checked

  const buttonTextColor = isPreviewedAndSelected
    ? colorPair.background
    : checked
      ? colorPair.background
      : colorPair.text

  const buttonBackgroundColor = isPreviewedAndSelected
    ? `${colorPair.text}F0`
    : isPreviewed
      ? `${colorPair.background}66`
      : checked
        ? colorPair.text
        : colorPair.background

  const buttonBorderColor = isPreviewedAndSelected
    ? `${colorPair.text}`
    : isPreviewed
      ? `${colorPair.text}99`
      : colorPair.text

  const buttonShadow = isPreviewedAndSelected
    ? `0 0 0 1px ${colorPair.background}40, 0 10px 24px ${colorPair.text}33`
    : isPreviewed
      ? `0 10px 24px ${colorPair.text}18`
      : undefined

  // valuable comment: checked is the local state of the checkbox, initialized in the course object
  return (
    <div
      key={``}
      className='w-full flex flex-row justify-between items-center py-1 px-2 mt-1 font-normal text-micro sm:text-caption lg:text-body duration-150 ease-linear select-none
      rounded-md shadow-elev-1 border backdrop-blur-[1px]'
      style={{
        borderColor: buttonBorderColor,
        borderStyle: isPreviewedAndSelected ? 'dashed' : 'solid',
        color: buttonTextColor,
        backgroundColor: buttonBackgroundColor,
        boxShadow: buttonShadow,
        opacity: isPreviewed && !checked ? 0.72 : 1
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
