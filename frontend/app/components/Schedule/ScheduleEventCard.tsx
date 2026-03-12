import { motion } from 'motion/react'
import { X, Eye } from 'lucide-react'
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
  const { previewSections, selectedSections, courseRegistry, hideSections, setCourseInvisible } = useCourseCache()
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

  const handleRemoveFromGrid = () => {
    hideSections(section)
  }
  const handleHideCourse = () => {
    const course = courseRegistry.get(section.courseKey)
    if (!course) return
    setCourseInvisible(course)
  }

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
      className="absolute rounded-lg"
      style={{
        top: positionStyle.top,
        height: positionStyle.height,
        width: positionStyle.width,
        left: positionStyle.left,
        zIndex: isHovered ? 30 : isPreviewHoveredAndSelected ? 25 : isPreviewHovered ? 20 : 10,
        borderColor: isPreviewHovered || isPreviewHoveredAndSelected ? `${textColor}${baseBorderAlpha}` : `${textColor}00`,
        borderStyle: isPreviewHoveredAndSelected ? 'dashed' : 'solid',
        borderWidth: isPreviewHoveredAndSelected ? '2px' : '1px',
      }}>
      <div
        className="
          relative w-full h-full overflow-hidden border-l-8 rounded-lg
          text-ellipsis text-micro md:text-caption lg:text-body select-none shadow-elev-1 transition-all duration-200
        "
        style={{
          backgroundColor: `${bgColor}${baseBackgroundAlpha}`,
          borderColor: `${textColor}${baseBorderAlpha}`,
          boxShadow: baseShadow,
          height: positionStyle.height,
          opacity: isPreviewHovered && !isSelected ? 0.68 : 1,
        }}>
        <p
          className='inline-block w-full h-full p-1 overflow-hidden text-ellipsis leading-tight'
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 100%)",
          }}
        >
          {capitalize(schedule.assignment)}<br />
          sección {section.sectionNumber}<br />
          {section.teacher}<br />
          Tope: {section.maxStudents}
        </p>
        <motion.div
          initial={false}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut',
          }}
          className="flex flex-row justify-end items-center absolute bottom-0 left-0 z-20 w-full gap-1 p-1"
          style={{
            pointerEvents: isHovered ? "auto" : "none",
            background: `linear-gradient(to bottom, transparent 0%, ${bgColor}${baseBackgroundAlpha} 100%)`,
            color: `${textColor}${baseBorderAlpha}`,
          }}
        >
          <Eye
            className="w-4 hover:scale-110 transition-all duration-200 cursor-pointer"
            onClick={handleHideCourse}
          ></Eye>
          <X
            className="w-4 hover:scale-110 transition-all duration-200 cursor-pointer"
            onClick={handleRemoveFromGrid}
          ></X>
        </motion.div>
      </div>
    </motion.div>
  )
}


export default ScheduleEventCard
