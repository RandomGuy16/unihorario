"use client"
import Select from 'react-select'
import { useState } from 'react'
import { useCourseCache } from "@/app/providers/useCourseCache";
import { useFilters } from "@/app/providers/useFilters";
import { useTheme } from "@/app/providers/useTheme";
import UploadCurriculumModal from "@/app/components/modals/UploadCurriculumModal";
import UploadPDFButton from "@/app/components/CoursesPanel/SearchFilter/UploadPDFButton";


interface selectFilterOption {
  label: string;
  value: string;
}

function SearchFilter() {
  const { selection, available: availableFilters, updateSelection } = useFilters()
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
      <span className="inline-block mb-2">Filtrar por:</span>
      <div>
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
      <div>
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
  )
}

export default SearchFilter;
