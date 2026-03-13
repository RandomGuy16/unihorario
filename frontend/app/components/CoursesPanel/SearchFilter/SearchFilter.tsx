"use client"
import Select from 'react-select'
import { ReactNode, useState } from 'react'
import { CheckCheck, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useCourseCache } from "@/app/providers/useCourseCache";
import { useFilters } from "@/app/providers/useFilters";
import { useTheme } from "@/app/providers/useTheme";
import UploadCurriculumModal from "@/app/components/modals/UploadCurriculumModal";
import UploadPDFButton from "@/app/components/CoursesPanel/SearchFilter/UploadPDFButton";


interface selectFilterOption {
  label: string;
  value: string;
}

interface BooleanFilterToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  value: boolean;
  onValueChange: (value: boolean) => void;
  trueLabel: string;
  falseLabel: string;
  icon: ReactNode;
}

function BooleanFilterToggle({
  title,
  description,
  enabled,
  onEnabledChange,
  value,
  onValueChange,
  trueLabel,
  falseLabel,
  icon
}: BooleanFilterToggleProps) {
  return (
    <div className="w-full flex flex-col justify-center items-center gap-2">
      <div className={'flex flex-row justify-between items-center w-full transition-all duration-200 ease-out'}>
        <div className="flex flex-row flex-1 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            {icon}
          </div>
          <div className="flex flex-col justify-start items-start">
            <div className="flex flex-row items-center gap-2">
              <span className="text-label font-semibold text-foreground">{title}</span>
              {enabled && (
                <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-micro uppercase tracking-[0.18em] text-accent">
              activo
            </span>
              )}
            </div>
            <p className="mt-1 text-body text-foreground-muted">{description}</p>
          </div>
        </div>
        <div className={'flex flex-row justify-center items-center gap-2 h-full'}>
          <button
            type="button"
            aria-pressed={enabled}
            aria-label={`Alternar filtro ${title}`}
            onClick={() => onEnabledChange(!enabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-all duration-200 ease-out ${
              enabled
                ? "border-accent bg-accent shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                : "border-border-strong bg-surface-muted"
            }`}
          >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-200 ease-out ${
              enabled ? "left-[1.45rem]" : "left-0.5"
            }`}
          />
          </button>
        </div>
      </div>
      <div className={`flex flex-row justify-center items-center gap-2 w-full transition-all duration-200 ${enabled ? "opacity-100" : "opacity-45"}`}>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => onValueChange(true)}
          className={`flex-1 rounded-lg border px-3 text-body font-medium transition-colors duration-150 ${
            value
              ? "border-accent bg-accent text-on-action"
              : "border-border bg-surface-muted text-foreground-muted"
          } disabled:cursor-not-allowed`}
        >
          {trueLabel}
        </button>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => onValueChange(false)}
          className={`flex-1 rounded-lg border px-3 text-body font-medium transition-colors duration-150 ${
            !value
              ? "border-accent-secondary bg-accent-secondary/15 text-foreground"
              : "border-border bg-surface-muted text-foreground-muted"
          } disabled:cursor-not-allowed`}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  )
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
        Carrera:
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
      <div className="mt-3 flex w-full items-center gap-2 text-foreground-muted">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-caption uppercase tracking-[0.18em]">Filtros</span>
      </div>
      <div className="w-full rounded-xl border border-border bg-surface px-3 py-3 shadow-elev-1">
        <div className={'flex flex-row justify-center items-center w-full'}>
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
        <hr className="my-2 h-px w-full border-border-strong" />
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
      </div>
    </div>
  )
}

export default SearchFilter;
