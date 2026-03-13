"use client"
import Select from 'react-select'
import { useState } from 'react'
import { AnimatePresence, motion } from "motion/react";
import { CheckCheck, Eye, EyeOff, Sparkles, GraduationCap } from 'lucide-react'
import { useCourseCache } from "@/app/providers/useCourseCache";
import { useFilters } from "@/app/providers/useFilters";
import { useTheme } from "@/app/providers/useTheme";
import UploadCurriculumModal from "@/app/components/modals/UploadCurriculumModal";
import UploadPDFButton from "@/app/components/CoursesPanel/SearchFilter/UploadPDFButton";
import { BooleanFilterToggle } from "@/app/components/CoursesPanel/SearchFilter/BooleanFilterToggle";


interface selectFilterOption {
  label: string;
  value: string;
}

function SearchFilter() {
  const {
    selection,
    available: availableFilters,
    updateSelection,
    filterBySelection,
    filterByVisibility,
    setFilterBySelection,
    setFilterByVisibility
  } = useFilters()
  const { clearSections } = useCourseCache()
  const { getReactSelectStyles } = useTheme()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // Listen for theme changes
  const selectStyles = getReactSelectStyles()

  return (
    <div className="flex flex-col justify-start items-start gap-1 w-full">
      {/* separate Select element for each category in filterChooser */}

      {/*
        when a select element from here changes the filters, the useEffect of CoursesPanel
        reconfigures the courses available
      */}
      <div className='w-full'>
        <div className="mt-3 flex w-full items-center gap-2 text-foreground-muted">
          <GraduationCap className="h-4 w-4 text-accent" />
          <span className="text-caption uppercase tracking-widest">Carrera</span>
        </div>
        <div className="flex flex-row justify-between items-center gap-2">
          <Select
            instanceId={"career-select"}
            className="text-label shadow-elev-1"
            styles={selectStyles} // Call the function
            options={
              availableFilters.careers.map(filterOption => ({
                value: filterOption,
                label: filterOption,
              }))
            }
            defaultValue={{
              label: selection.career,
              value: selection.career
            }}
            value={{
              label: selection.career,
              value: selection.career
            }}
            onChange={(newValue: unknown) => {
              updateSelection({
                career: (newValue as selectFilterOption).value
              })
              // clear the sections when the career changes
              clearSections()
            }}>
          </Select>
          <UploadPDFButton setOpen={setShowUploadModal} />
          <UploadCurriculumModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
        </div>
      </div>
      <div className="flex w-full items-center gap-2 text-foreground-muted">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-caption uppercase tracking-widest">Filtros</span>
      </div>
      <div className="w-full rounded-xl border border-border bg-surface px-3 py-3 shadow-elev-1">
        <div className={'flex flex-row justify-center items-center gap-2 w-full'}>
          <div className={'flex-1'}>
            Ciclo: <Select
            instanceId={"cycle-select"}
            className="text-label shadow-elev-1"
            styles={selectStyles}
            options={
              availableFilters.cycles.map(filterOption => ({
                label: filterOption,
                value: filterOption,
              }))
            }
            defaultValue={{
              label: selection.cycle,
              value: selection.cycle
            }}
            value={{
              label: selection.cycle,
              value: selection.cycle
            }}
            onChange={(newValue: unknown) => {
              updateSelection({
                cycle: (newValue as selectFilterOption).value
              })
            }}>
          </Select>
          </div>
          <div className={'flex-1'}>
            Plan de estudios: <Select
            instanceId={"plan-select"}
            className="text-label shadow-elev-1"
            styles={selectStyles}
            options={
              availableFilters.years.map(filterOption => ({
                label: filterOption,
                value: filterOption
              }))
            }
            defaultValue={{
              label: selection.year,
              value: selection.year
            }}
            value={{
              label: selection.year,
              value: selection.year
            }}
            onChange={(newValue: unknown) => {
              updateSelection({
                year: (newValue as selectFilterOption).value
              })
            }}>
          </Select>
          </div>
        </div>
        <div className="flex flex-col justify-center items-start mt-1">
          <button
            className="text-foreground-muted hover:text-foreground px-2 rounded-xl transition-colors duration-200 cursor-pointer"
          onClick={() => setShowMoreFilters(prev => !prev)}>
            <span className="inline-block text-caption uppercase tracking-widest">Mas filtros</span>
          </button>
        </div>
        <AnimatePresence initial={false}>
          {showMoreFilters && (<motion.div
            key="more-filters"
            initial={{opacity: 0, height: 0, y: -6}}
            animate={{opacity: 1, height: "auto", y: 0}}
            exit={{opacity: 0, height: 0, y: -6}}
            transition={{duration: 0.2, ease: "easeOut"}}
            className="w-full overflow-hidden"
          >
            <hr className="h-px w-full border-border-strong mb-2" />
            <div className="flex flex-col gap-4">
              <BooleanFilterToggle
                title="Por visibilidad"
                description="Cursos visibles"
                enabled={filterByVisibility}
                onEnabledChange={setFilterByVisibility}
                value={selection.visible}
                onValueChange={(value) => updateSelection({ visible: value })}
                trueLabel="Visibles"
                falseLabel="Ocultos"
                icon={selection.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              />
              <BooleanFilterToggle
                title="Por seleccion"
                description="Cursos con al menos 1 sección seleccionada"
                enabled={filterBySelection}
                onEnabledChange={setFilterBySelection}
                value={selection.selected}
                onValueChange={(value) => updateSelection({ selected: value })}
                trueLabel="Seleccionados"
                falseLabel="No seleccionados"
                icon={<CheckCheck className="h-4 w-4" />}
              />
            </div>
          </motion.div>)}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SearchFilter;
