import Select, {StylesConfig} from 'react-select'
import { useState } from 'react'
import getReactSelectStyles from "@/app/components/CoursesPanel/ReactSelectStyles";
import { useCourseCache } from "@/app/contexts/useCourseCache";
import { useFilters } from "@/app/contexts/useFilters";


interface selectFilterOption {
  label: string;
  value: string;
}

function SearchFilter() {
  const {selection, available: availableFilters, updateSelection} = useFilters()
  const { clearSections } = useCourseCache()
  // Listen for theme changes
  const [selectStyles, setSelectStyles] = useState<StylesConfig>(getReactSelectStyles())
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    // Re-render or update styles
    setSelectStyles(getReactSelectStyles())
  });
  return (
    <div className="flex flex-col justify-start items-start w-full">
      {/* separate Select element for each category in filterChooser */}

      {/*
        when a select element from here changes the filters, the useEffect of CoursesPanel
        reconfigures the courses available
      */}
      <div>
        Carrera: <Select
          className="text-base font-normal my-1 mt-0 shadow-lg dark:shadow-md dark:shadow-black"
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
      </div>
      <div>
        Ciclo: <Select
          className="text-base font-normal text-white my-1 shadow-lg dark:shadow-md dark:shadow-black"
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
          className="text-base font-normal text-white my-1 mb-0 shadow-lg dark:shadow-md dark:shadow-black"
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
