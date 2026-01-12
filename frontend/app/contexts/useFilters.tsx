import {createContext, ReactNode, useContext, useEffect, useMemo, useState} from "react"
import {FilterOptions, SelectedFilters} from "@/app/models/SelectedFilters"
import {UniversityCurriculum} from "@/app/models/UniversityCurriculum";
import {useCurriculum} from "@/app/reducers/useCurriculum";

const INITIAL_SELECTION: SelectedFilters = {year: "", cycle: "", career: ""}
const INITIAL_AVAILABLE: FilterOptions = {years: [], careers: [], cycles: []}


function computeAvailableOptions(data: UniversityCurriculum): FilterOptions {
  const years = data.years.map(y => y.year)
  const careers = Array.from(new Set(
    data.years.flatMap(year => year.careerCurriculums.map(c => c.name
    ))
  ))
  const cycles = Array.from(new Set(
    data.years.flatMap(year =>
      year.careerCurriculums.flatMap(
        career => career.cycles.map(cycle => cycle.name)
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
  // const [available, setAvailable] = useState<FilterOptions>({years: [], cycles: [], careers: []})
  const { data } = useCurriculum().state
  const available = useMemo(() => {
    if (data) {
      return computeAvailableOptions(data)
    } else {
      return INITIAL_AVAILABLE
    }
  }, [data])

  useEffect(() => {
    if (!data) return;

    // const newOptions = computeAvailableOptions(data)
    // setAvailable(newOptions)

    // Optional: Auto-select the first available options if current selection is empty
    /*
    if (!selection.year && years.length > 0) {
      setSelection({
        year: years[0],
        career: careers[0],
        cycle: cycles[0]
      });
    }
    */
  }, [data])

  return (
    <>
      <FiltersContext.Provider value={{
        selection,
        available,
        updateSelection: (updates: Partial<SelectedFilters>) => setSelection(prev => ({...prev, ...updates})),
        updateAvailableOptions: (data: UniversityCurriculum) => setSelection({...INITIAL_SELECTION, ...computeAvailableOptions(data)})
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
