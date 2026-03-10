import { motion } from 'motion/react'
import { useState } from "react";
import { CourseSection } from "@/app/models/CourseSection";
import { Schedule } from "@/app/models/Schedule";
import { CourseColor, getCourseColor } from "@/app/utils/CourseCard";
import { capitalize } from "@/app/utils/misc";
import { useTheme } from "@/app/providers/useTheme";
import { useCourseCache } from "@/app/providers/useCourseCache"


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
  const [isHovered, setIsHovered] = useState(false)
  const { previewSections, selectedSections } = useCourseCache()
  const { theme } = useTheme()

  // get the color pair for the event card
  const colorPair: CourseColor = getCourseColor(section.assignmentId)

  // useState to manage text and background colors
  const textColor = theme == "dark" ? colorPair.background : colorPair.text
  const bgColor = theme == "dark" ? colorPair.text : colorPair.background

  const isPreviewHovered = previewSections.has(section)
  const isSelected = selectedSections.has(section)
  const isPreviewHoveredAndSelected = isPreviewHovered && isSelected
  const baseBackgroundAlpha = isPreviewHoveredAndSelected ? 'F0' : isPreviewHovered ? '55' : 'EE'
  const baseBorderAlpha = isPreviewHoveredAndSelected ? 'FF' : isPreviewHovered ? '88' : 'EE'
  const baseShadow = isPreviewHoveredAndSelected
    ? '0 14px 34px rgba(0, 0, 0, 0.24)'
    : isPreviewHovered
      ? '0 8px 22px rgba(0, 0, 0, 0.10)'
      : '0 6px 18px rgba(0, 0, 0, 0.12)'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 12, filter: 'blur(4px)' }}
      animate={{
        opacity: 1,
        scale: isPreviewHoveredAndSelected ? 1.025 : isPreviewHovered ? 1.005 : 1,
        y: 0,
        filter: 'blur(0px)'
      }}
      exit={{ opacity: 0, scale: 0.9, y: -10, filter: 'blur(4px)' }}
      whileHover={{
        scale: 1.03,
        y: -4,
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
        backgroundColor: `${bgColor}FF`,
        borderColor: `${textColor}FF`
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{
        layout: { type: 'spring', stiffness: 380, damping: 30 },
        duration: 0.2,
        ease: 'easeOut'
      }}
      className="absolute border-2 border-transparent rounded-lg"
      style={{
        top: positionStyle.top,
        height: positionStyle.height,
        width: positionStyle.width,
        left: positionStyle.left,
        zIndex: isHovered ? 30 : isPreviewHoveredAndSelected ? 25 : isPreviewHovered ? 20 : 10,
        borderColor: isPreviewHovered || isPreviewHoveredAndSelected ? `${textColor}${baseBorderAlpha}` : 'transparent',
        borderStyle: isPreviewHoveredAndSelected ? 'dashed' : 'solid'
      }}>
      <div
        className="
          absolute p-1 min-h-20 w-full border-l-8 rounded-lg text-ellipsis text-micro md:text-caption
          lg:text-body select-none shadow-elev-1 transition-all duration-200
        "
        style={{
          backgroundColor: `${bgColor}${baseBackgroundAlpha}`,
          borderColor: `${textColor}${baseBorderAlpha}`,
          boxShadow: baseShadow,
          height: positionStyle.height,
          opacity: isPreviewHovered && !isSelected ? 0.68 : 1,
        }}>
        <p className='inline-block w-full overflow-hidden text-ellipsis'>
          {capitalize(schedule.assignment)}<br />
          sección {section.sectionNumber}<br />
          {section.teacher}<br />
          Tope: {section.maxStudents}
        </p>
      </div>
    </motion.div>
  )
}


export default ScheduleEventCard
