import { useState } from 'react';
import { motion } from 'motion/react';
import { CourseSection } from "@/app/models/CourseSection";
import { Schedule } from "@/app/models/Schedule";
import { CourseColor, getCourseColor } from "@/app/utils/CourseCard";
import { capitalize } from "@/app/utils/misc";
import { useTheme } from "@/app/providers/useTheme";


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
  const { theme } = useTheme()

  // get the color pair for the event card
  const colorPair: CourseColor = getCourseColor(section.assignmentId)

  // useState to manage text and background colors
  const [textColor, setTextColor] = useState<string>(theme == "dark" ? colorPair.background : colorPair.text)
  const [bgColor, setBgColor] = useState<string>(theme == "dark" ? colorPair.text : colorPair.background)

  // handle theme changes
  /*
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    setTextColor(e.matches ? colorPair.background : colorPair.text)
    setBgColor(e.matches ? colorPair.text : colorPair.background)
  })
  */

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -8 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 24 },
        duration: 0.28,
        ease: 'easeOut'
      }}
      className="
        absolute p-1 min-h-20 w-full rounded-lg border-2 text-ellipsis text-micro md:text-caption
        lg:text-body select-none
      "
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
    </motion.div>
  )
}


export default ScheduleEventCard
