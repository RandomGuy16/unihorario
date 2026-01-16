import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react"
import { FilterOptions, SelectedFilters } from "@/app/models/SelectedFilters"
import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";
import { useCurriculum } from "@/app/reducers/useCurriculum";

const INITIAL_SELECTION: SelectedFilters = {year: "", cycle: "", career: ""}
const INITIAL_AVAILABLE: FilterOptions = {years: [], careers: [], cycles: []}


function computeAvailableOptions(data: UniversityCurriculum): FilterOptions {
  const years = data.years.map(y => y.year)
  const careers = Array.from(new Set(
    data.years.flatMap(year => year.careerCurriculums.map(c => c.metadata.school
    ))
  ))
  const cycles = Array.from(new Set(
    data.years.flatMap(year =>
      year.careerCurriculums.flatMap(
        career => career.cycles.map(cycle => cycle.cycle)
      )
    )
  ))
  return {years, careers, cycles}
}

export interface FiltersContextType {
  selection: SelectedFilters;
  available: FilterOptions;
  updateSelection: (updates: Partial<SelectedFilters>) => void;
  updateAvailableOptions: (data: UniversityCurriculum) => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function FiltersContextProvider({children} : {children: ReactNode}) {
  const [selection, setSelection] = useState<SelectedFilters>(INITIAL_SELECTION)
  const [available, setAvailable] = useState<FilterOptions>(INITIAL_AVAILABLE)
  const { data } = useCurriculum()

  const updateSelection =  useCallback(
    (updates: Partial<SelectedFilters>) => setSelection(prev => ({...prev, ...updates})),
    [setSelection])
  const updateAvailableOptions = useCallback(
    (data: UniversityCurriculum) => setSelection({...INITIAL_SELECTION, ...computeAvailableOptions(data)}),
    [setSelection]
  )
  useEffect(() => {
    if (!data) return;

    const newOptions = computeAvailableOptions(data)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailable(newOptions)

    if (!selection.year && data.years.length > 0) {
      setSelection({
        year: available.years[0],
        career: available.careers[0],
        cycle: available.cycles[0]
      });
    }
  }, [available.careers, available.cycles, available.years, data, selection.year])

  return (
    <>
      <FiltersContext.Provider value={{
        selection,
        available,
        updateSelection,
        updateAvailableOptions
      }}>
        {children}
      </FiltersContext.Provider>
    </>
  )
}

export function useFilters() {
  const context = useContext(FiltersContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersContextProvider')
  }
  return context
}
