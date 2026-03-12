import { Search } from 'lucide-react'
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
}

function withAlpha(hexColor: string, alpha: string): string {
  return hexColor.length === 9 ? `${hexColor.slice(0, 7)}${alpha}` : `${hexColor}${alpha}`
}

export default function CourseCardSection({ course, section, colorPair }: CourseCardCheckboxProps) {
  const { renderSections, hideSections, previewSections, selectedSections } = useCourseCache()
  const isSelected = selectedSections.has(section)
  const isPreviewed = previewSections.has(section)
  const isPreviewedAndSelected = isSelected && isPreviewed

  // function to handle the click event of the checkbox
  const handleClick = () => {
    // if is not checked: not added -> add the course now
    if (!isSelected) {
      renderSections(section, course)
    }
    else {
      hideSections(section, course)
    }
  }

  const handleMouseEnter = () => {
    // just show the sections in a manner that they don't feel already selected
    renderSections(section, course, true)
  }
  const handleMouseLeave = () => {
    // like previously said but inverted
    hideSections(section, course, true)
  }

  const buttonTextColor = isPreviewedAndSelected || isSelected
    ? colorPair.background
    : colorPair.text

  const buttonBackgroundColor = isPreviewedAndSelected
    ? withAlpha(colorPair.text, "F5")
    : isSelected
      ? colorPair.text
      : isPreviewed
        ? withAlpha(colorPair.background, "8A")
        : colorPair.background

  const buttonBorderColor = isPreviewedAndSelected
    ? colorPair.text
    : isSelected
      ? colorPair.text
      : isPreviewed
        ? withAlpha(colorPair.text, "B3")
        : colorPair.text

  const buttonShadow = isPreviewedAndSelected
    ? `0 0 0 1px ${withAlpha(colorPair.background, "4D")}, 0 12px 28px ${withAlpha(colorPair.text, "38")}`
    : isPreviewed
      ? `0 8px 18px ${withAlpha(colorPair.text, "22")}`
      : isSelected
        ? `0 6px 14px ${withAlpha(colorPair.text, "22")}`
        : undefined

  // valuable comment: checked is the local state of the checkbox, initialized in the course object
  return (
    <div
      key={``}
      className='
      w-full flex flex-row justify-between items-center py-1 px-2 mt-1 font-normal text-micro sm:text-caption
      lg:text-body duration-150 ease-linear select-none rounded-md shadow-elev-1 border backdrop-blur-[1px]'
      style={{
        borderColor: buttonBorderColor,
        borderStyle: isPreviewedAndSelected ? 'dashed' : 'solid',
        color: buttonTextColor,
        backgroundColor: buttonBackgroundColor,
        boxShadow: buttonShadow,
        opacity: isPreviewed && !isSelected ? 0.9 : 1
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Label element to display section data and add it to the calendar on click */}
      <label className='flex-1 cursor-pointer'>
        <input
          className="hidden"
          type="checkbox"
          checked={isSelected}
          onChange={handleClick}
        />
        <div className="w-full">
          Secci&oacute;n {section.sectionNumber}<br />
          <div className="flex flex-row justify-between items-center gap-2 w-full">
            <span>Profesor: {section.teacher}</span>
            <a
              target="_blank"
              href="https://peru.misprofesores.com/escuelas/Universidad-Nacional-de-San-Marcos_1135"
              title="Buscar en misprofesores.com"
              className="group text-label hover:text-body font-bold transition-colors duration-200"
            >
              <Search
                className="
                h-4 w-4 transition-all duration-200 ease-out filter drop-shadow-[0_0_4px_rgba(255,255,255,0.25)]
                group-hover:scale-110 group-hover:brightness-125 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
              />
            </a>
          </div>
            Tope de alumnos: {section.maxStudents}
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
