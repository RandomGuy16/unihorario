"use client"
import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react"
import { FilterOptions, SelectedFilters } from "@/app/models/SelectedFilters"
import { useCatalog } from "@/app/reducers/useCatalog";
import { Catalog } from "@/app/models/Catalog";

const INITIAL_SELECTION: SelectedFilters = {year: "", cycle: "", career: ""}
const INITIAL_AVAILABLE: FilterOptions = {years: [], careers: [], cycles: []}


function computeAvailableOptions(data: Catalog): FilterOptions {
  const careers: string[] = []
  const years: string[] = []
  const cycles: string[] = []
  for (const [career, careerData] of Object.entries(data)) {
    careers.push(career)
    years.push(...careerData.studyPlans)
    cycles.push(...careerData.cycles)
  }

  return {
    years: Array.from(new Set(years)),
    careers,
    cycles: Array.from(new Set(cycles))}
}

export interface FiltersContextType {
  selection: SelectedFilters;
  available: FilterOptions;
  updateSelection: (updates: Partial<SelectedFilters>) => void;
  updateAvailableOptions: (data: Catalog) => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function FiltersContextProvider({children} : {children: ReactNode}) {
  const [selection, setSelection] = useState<SelectedFilters>(INITIAL_SELECTION)
  const [available, setAvailable] = useState<FilterOptions>(INITIAL_AVAILABLE)
  const { data } = useCatalog()

  const updateSelection =  useCallback(
    (updates: Partial<SelectedFilters>) => setSelection(prev => ({...prev, ...updates})),
    [setSelection])
  const updateAvailableOptions = useCallback(
    (data: Catalog) => setSelection({...INITIAL_SELECTION, ...computeAvailableOptions(data)}),
    [setSelection]
  )

  useEffect(() => {
    if (!data) return;

    const newOptions = computeAvailableOptions(data)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailable(newOptions)
  }, [data])

  useEffect(() => {
    // this only runs on mount
    if (!selection.year && !selection.cycle && !selection.career && data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelection({
        year: available.years[0],
        career: available.careers[0],
        cycle: available.cycles[0]
      });
    }
  }, [available]);

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
