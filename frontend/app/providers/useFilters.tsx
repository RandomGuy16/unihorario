"use client"
import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react"
import { FilterOptions, SelectedFilters } from "@/app/models/SelectedFilters"
import { useCurriculum } from "@/app/providers/useCurriculum";
import { useCatalog } from "@/app/providers/useCatalog";
import { Catalog } from "@/app/models/Catalog";

const INITIAL_SELECTION: SelectedFilters = {year: "", cycle: "", career: ""}
const INITIAL_AVAILABLE: FilterOptions = {years: [], careers: [], cycles: []}


function computeAvailableOptions(catalog: Catalog, currentCareer: string = ''): FilterOptions {
  const careers: string[] = Object.keys(catalog.careers)

  // if there's a current career selected, go with it
  let career: string = currentCareer
  // if there are more careers in the catalog. choose the already selected
  // if not, choose the first from the catalog (this happens on mount)
  if (careers.length > 0) career = currentCareer ? currentCareer : careers[0];

  const years: string[] = catalog.careers[career].studyPlans
  const cycles: string[] = catalog.careers[career].cycles

  return {
    careers,
    years: Array.from(new Set(years)),
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
  const { fetchCurriculum } = useCurriculum()
  const { data: catalog } = useCatalog()

  const updateSelection =  useCallback(
    (updates: Partial<SelectedFilters>) => setSelection(prev => ({...prev, ...updates})),
    [setSelection])
  const updateAvailableOptions = useCallback(
    (catalog: Catalog, currCareer: string = selection.career) => setAvailable({
      ...INITIAL_SELECTION,
      ...computeAvailableOptions(catalog, currCareer)
    }),
    [setAvailable, selection.career]
  )

  // useEffect block that fetches the curriculum when the selected career changes
  useEffect(() => {
    if (selection.career) {
      fetchCurriculum(selection.career)
    }
  }, [fetchCurriculum, selection.career, updateAvailableOptions]);

  // useEffect block that updates the available filter options
  // each time the catalog changes
  useEffect(() => {
    if (!catalog) return;
    updateAvailableOptions(catalog)
  }, [catalog, updateAvailableOptions])

  // useEffect block that auto selects the filters each time the available options change
  useEffect(() => {
    if (available.careers.length && available.years.length && available.cycles.length) {
      updateSelection({
        year: available.years[0],
        cycle: available.cycles[0],
        // auto selects first career if not selected
        career: (!selection.career) ? available.careers[0] : selection.career
      })
    }
  }, [available, selection.career, updateSelection]);

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
