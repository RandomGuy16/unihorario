import { Course} from "@/app/models/Course";
import { CourseColor } from "@/app/utils/CourseCard";
import { useCourseCache } from "@/app/providers/useCourseCache";

interface CourseCardCheckboxAllProps {
  course: Course;
  colorPair: CourseColor;
  checked: boolean;
}

function withAlpha(hexColor: string, alpha: string): string {
  return hexColor.length === 9 ? `${hexColor.slice(0, 7)}${alpha}` : `${hexColor}${alpha}`
}

export function CourseCardAllSectionsCheckbox({course, colorPair, checked}: CourseCardCheckboxAllProps) {
  const {renderSections, hideSections, previewSections} = useCourseCache()
  // function to handle the click event of the checkbox
  const handleClick = () => {
    if (!checked) renderSections(course.getSections())
    else hideSections(course.getSections())
  }
  const handleMouseEnter = () => {
    // just show the sections in a manner that they don't feel already selected
    renderSections(course.getSections(), true)
  }
  const handleMouseLeave = () => {
    // like previously said but inverted
    hideSections(course.getSections(), true)
  }

  const courseSections = course.getSections()
  const hasPreviewedSections = courseSections.some((section) => previewSections.has(section))
  const isPreviewedAndSelected = hasPreviewedSections && checked

  const buttonTextColor = isPreviewedAndSelected || checked
    ? colorPair.background
    : colorPair.text

  const buttonBackgroundColor = isPreviewedAndSelected
    ? withAlpha(colorPair.text, "F5")
    : checked
      ? colorPair.text
      : hasPreviewedSections
        ? withAlpha(colorPair.background, "8A")
        : colorPair.background

  const buttonBorderColor = isPreviewedAndSelected
    ? colorPair.text
    : checked
      ? colorPair.text
      : hasPreviewedSections
        ? withAlpha(colorPair.text, "B3")
        : colorPair.text

  const buttonShadow = isPreviewedAndSelected
    ? `0 0 0 1px ${withAlpha(colorPair.background, "4D")}, 0 12px 28px ${withAlpha(colorPair.text, "38")}`
    : hasPreviewedSections
      ? `0 8px 18px ${withAlpha(colorPair.text, "22")}`
      : checked
        ? `0 6px 14px ${withAlpha(colorPair.text, "22")}`
        : undefined

  return (
    <div
      className="flex flex-row justify-start items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <label
        className="
        py-1 px-2 mr-1 font-normal text-micro sm:text-caption lg:text-body duration-100 ease-linear select-none
        rounded-md shadow-elev-1 border cursor-pointer"
        data-checked={checked}
        style={{
          borderColor: buttonBorderColor,
          borderStyle: isPreviewedAndSelected ? 'dashed' : 'solid',
          color: buttonTextColor,
          backgroundColor: buttonBackgroundColor,
          boxShadow: buttonShadow,
          opacity: hasPreviewedSections && !checked ? 0.9 : 1
        }}>
        <input
          className="hidden"
          type="checkbox"
          checked={checked}
          onChange={handleClick}/>
        todas
      </label>
    </div>
  )
}