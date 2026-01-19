import { useState } from 'react'
import { CourseSection } from "@/app/models/CourseSection";
import { Schedule } from "@/app/models/Schedule";
import { CourseColor, getCourseColor } from "@/app/utils/CourseCard";
import { capitalize } from "@/app/utils/misc";


interface ScheduleEventCardProps {
  schedule: Schedule;
  section: CourseSection;
  positionStyle: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
}
function ScheduleEventCard({ schedule, section, positionStyle }: ScheduleEventCardProps) {
  const isInitiallyDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // get the color pair for the event card
  const colorPair: CourseColor = getCourseColor(section.assignmentId)

  // useState to manage text and background colors
  const [textColor, setTextColor] = useState<string>(isInitiallyDark ? colorPair.background : colorPair.text)
  const [bgColor, setBgColor] = useState<string>(isInitiallyDark ? colorPair.text : colorPair.background)

  // handle theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    setTextColor(e.matches ? colorPair.background : colorPair.text)
    setBgColor(e.matches ? colorPair.text : colorPair.background)
  })

  return (
    <div className="
      absolute p-1 min-h-20 w-full rounded-lg border-2 text-ellipsis text-micro md:text-caption lg:text-body"
      style={{
        top: positionStyle.top,
        height: positionStyle.height,
        backgroundColor: `${bgColor}60`,
        borderColor: `${textColor}60`,
        width: positionStyle.width,
        left: positionStyle.left
      }}>
      <p className='inline-block w-full overflow-hidden text-ellipsis'>
        {capitalize(schedule.assignment)}<br />
        sección {section.sectionNumber}<br />
        {section.teacher}<br />
        Tope: {section.maxStudents}
      </p>
    </div>
  )
}


export default ScheduleEventCard
