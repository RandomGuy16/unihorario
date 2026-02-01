"use client"
import { useCallback, useEffect, useReducer, useContext, createContext, ReactNode } from 'react'
import { CatalogService } from "@/app/services/CatalogService";
import { Catalog } from "@/app/models/Catalog"

// Define the shape of our state
interface CatalogState {
  data: Catalog | null;
  loading: boolean;
  error: string | null;
}

type CatalogAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS', payload: Catalog }
  | { type: 'FETCH_ERROR', payload: string }

function catalogReducer(state: CatalogState, action: CatalogAction) {
  switch (action.type) {
    case "FETCH_START":
      return {...state, loading: true, error: null}
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        data: action.payload
      }
    case "FETCH_ERROR":
      return {...state, loading: false, error: action.payload}
    default:
      return state
  }
}

function useCatalogLoader() {
  const [state, dispatch] = useReducer(catalogReducer, {
    data: null,
    loading: false,
    error: null
  })

  const _handleFetch = useCallback(async (fetchFn: () => Promise<Catalog>,) => {
    // set the state on fetch start
    dispatch({type: "FETCH_START"})
    try {
      // execute the callback and set the state on fetch success
      const data = await fetchFn()
      dispatch({ type: "FETCH_SUCCESS", payload: data})
    } catch (err) {
      // set the state on fetch error
      dispatch({ type: "FETCH_ERROR", payload: (err as Error).message })
    }
  }, [])

  const loadData = useCallback(async () => {
    await _handleFetch(() => CatalogService.fetchCatalog())
      // console.log("UseCatalogLoader::fetch: ", data)
  }, [_handleFetch])

  const awaitDataRefresh = useCallback(async (catalogRefreshJobId: string) => {
    await _handleFetch(() => CatalogService.awaitCatalogRefresh(catalogRefreshJobId))
  }, [_handleFetch])

  // trigger fetch on mount
  useEffect(() => {
    loadData().then()
  }, [loadData]);

  return { ...state, refreshCatalog: loadData, awaitCatalogRefresh: awaitDataRefresh }
}

interface CatalogContextType extends CatalogState {
  refreshCatalog     : () => Promise<void>;
  awaitCatalogRefresh: (catalogRefreshJobId: string) => Promise<void>;
}
const CatalogContext = createContext<CatalogContextType | undefined>(undefined)

export function CatalogContextProvider({ children }: { children: ReactNode }) {
  const catalogState = useCatalogLoader()
  return (
    <CatalogContext.Provider value={catalogState}>
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const context = useContext(CatalogContext)
  if (context === undefined) {
    throw new Error('useCatalogContext must be used within a CatalogProvider')
  }
  return context
}
