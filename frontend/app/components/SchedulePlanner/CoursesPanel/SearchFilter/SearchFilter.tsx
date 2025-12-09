import Select from 'react-select'
import { useState } from 'react'
import { FilterChooser, Filters, SectionSelectionOps } from '../../../global/types.ts'
import getReactSelectStyles from "../ReactSelectStyles.ts";


interface selectFilterOption {
  label: string;
  value: string;
}
interface SearchFilterProps {
  filterChooser: FilterChooser;
  selectedFilters: Filters;
  setSelectedFiltersSet: (filters: Filters) => void;
  sectionOps: SectionSelectionOps;
}
function SearchFilter({ filterChooser, selectedFilters, setSelectedFiltersSet, sectionOps }: SearchFilterProps) {
  // Listen for theme changes
  const [selectStyles, setSelectStyles] = useState<any>(getReactSelectStyles())
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
            filterChooser.careers.map(filterOption => ({
              value: filterOption,
              label: filterOption,
            }))
          }
          defaultValue={{
            label: selectedFilters.career,
            value: selectedFilters.career
          }}
          value={{
            label: selectedFilters.career,
            value: selectedFilters.career
          }}
          onChange={(newValue: unknown) => {
            setSelectedFiltersSet({
              career: (newValue as selectFilterOption).value,
              cycle: selectedFilters.cycle,
              year: selectedFilters.year
            })
            // clear the sections when the career changes
            sectionOps.clearSections()
          }}>
        </Select>
      </div>
      <div>
        Ciclo: <Select
          className="text-base font-normal text-white my-1 shadow-lg dark:shadow-md dark:shadow-black"
          styles={selectStyles}
          options={
            filterChooser.cycles.map(filterOption => ({
              label: filterOption,
              value: filterOption,
            }))
          }
          defaultValue={{
            label: selectedFilters.cycle,
            value: selectedFilters.cycle
          }}
          value={{
            label: selectedFilters.cycle,
            value: selectedFilters.cycle
          }}
          onChange={(newValue: unknown) => {
            setSelectedFiltersSet({
              career: selectedFilters.career,
              cycle: (newValue as selectFilterOption).value,
              year: selectedFilters.year
            })
          }}>
        </Select>
      </div>
      <div>
        Plan de estudios: <Select
          className="text-base font-normal text-white my-1 mb-0 shadow-lg dark:shadow-md dark:shadow-black"
          styles={selectStyles}
          options={
            filterChooser.years.map(filterOption => ({
              label: filterOption,
              value: filterOption
            }))
          }
          defaultValue={{
            label: selectedFilters.year,
            value: selectedFilters.year
          }}
          value={{
            label: selectedFilters.year,
            value: selectedFilters.year
          }}
          onChange={(newValue: unknown) => {
            setSelectedFiltersSet({
              career: selectedFilters.career,
              cycle: selectedFilters.cycle,
              year: (newValue as selectFilterOption).value,
            })
          }}>
        </Select>
      </div>
    </div>
  )
}

export default SearchFilter;
