"use client"
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { FilterOptions, SelectedFilters } from "@/app/models/SelectedFilters"
import { useCurriculum } from "@/app/providers/useCurriculum";
import { useCatalog } from "@/app/providers/useCatalog";
import { Catalog } from "@/app/models/Catalog";
import { areEqualArray } from "@/app/utils/misc";

const INITIAL_SELECTION: SelectedFilters = {year: "", cycle: "", career: "", selected: true, visible: true}
const INITIAL_AVAILABLE: FilterOptions = {
  years: ['todos'], careers: ['todas'], cycles: ['todos'], areSelected: [true, false], areVisible: [true, false]
}

function computeAvailableOptions(catalog: Catalog, currentCareer: string = ""): FilterOptions {
  const careers: string[] = Object.keys(catalog.careers)

  const selectedCareer = careers.includes(currentCareer) ? currentCareer : careers[0]
  const years: string[] = [...catalog.careers[selectedCareer].studyPlans, ...INITIAL_AVAILABLE.years]
  const cycles: string[] = [...catalog.careers[selectedCareer].cycles, ...INITIAL_AVAILABLE.cycles]

  return {
    careers,
    years: Array.from(new Set(years)),
    cycles: Array.from(new Set(cycles)),
    areSelected: INITIAL_AVAILABLE.areSelected,
    areVisible: INITIAL_AVAILABLE.areVisible
  }
}

export interface FiltersContextType {
  selection: SelectedFilters;
  available: FilterOptions;
  updateSelection: (updates: Partial<SelectedFilters>) => void;
  updateAvailableOptions: (catalog: Catalog, currentCareer?: string) => void;
  filterBySelection: boolean;
  filterByVisibility: boolean;
  setFilterBySelection: (value: boolean) => void;
  setFilterByVisibility: (value: boolean) => void;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function FiltersContextProvider({children} : {children: ReactNode}) {
  const [selection, setSelection] = useState<SelectedFilters>(INITIAL_SELECTION)
  const [available, setAvailable] = useState<FilterOptions>(INITIAL_AVAILABLE)
  const [filterBySelection, setFilterBySelection] = useState<boolean>(false)
  const [filterByVisibility, setFilterByVisibility] = useState<boolean>(false)
  const { fetchCurriculum } = useCurriculum()
  const { data: catalog } = useCatalog()

  const updateSelection =  useCallback(
    (updates: Partial<SelectedFilters>) => setSelection(prev => {
      const next = {...prev, ...updates}
      if (
        next.year === prev.year &&
        next.cycle === prev.cycle &&
        next.career === prev.career &&
        next.selected === prev.selected &&
        next.visible === prev.visible
      ) {
        return prev
      }
      return next
    }),
    [setSelection])

  const updateAvailableOptions = useCallback(
    (catalogData: Catalog, currentCareer: string = "") => {
      const nextAvailable = computeAvailableOptions(catalogData, currentCareer)
      setAvailable(prev => {
        const isSame =
          areEqualArray(prev.careers, nextAvailable.careers) &&
          areEqualArray(prev.years, nextAvailable.years) &&
          areEqualArray(prev.cycles, nextAvailable.cycles)
        return isSame ? prev : nextAvailable
      })
    },
    [setAvailable]
  )

  // useEffect block that fetches the curriculum when the selected career changes
  useEffect(() => {
    if (selection.career) {
      fetchCurriculum(selection.career)
    }
  }, [fetchCurriculum, selection.career]);

  // useEffect block that updates the available filter options
  // each time the catalog changes
  useEffect(() => {
    if (!catalog) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateAvailableOptions(catalog, selection.career)
  }, [catalog, selection.career, updateAvailableOptions])

  // useEffect block that auto selects the filters each time the available options change
  useEffect(() => {
    if (!available.careers.length) return

    const nextCareer = available.careers.includes(selection.career) ? selection.career : available.careers[0]
    const nextYear = available.years.includes(selection.year) ? selection.year : (available.years[0] ?? "")
    const nextCycle = available.cycles.includes(selection.cycle) ? selection.cycle : (available.cycles[0] ?? "")

    if (nextCareer === selection.career && nextYear === selection.year && nextCycle === selection.cycle) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateSelection({ career: nextCareer, year: nextYear, cycle: nextCycle })
  }, [available, selection.career, selection.cycle, selection.year, updateSelection]);

  const contextValue = useMemo(() => ({
    selection,
    available,
    updateSelection,
    updateAvailableOptions,
    filterBySelection,
    filterByVisibility,
    setFilterBySelection,
    setFilterByVisibility
  }), [selection, available, updateSelection, updateAvailableOptions, filterBySelection, filterByVisibility])

  return (
    <>
      <FiltersContext.Provider value={contextValue}>
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
