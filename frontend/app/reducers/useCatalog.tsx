"use client"
import { useCallback, useEffect, useReducer } from 'react'
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

export function useCatalog() {
  const [state, dispatch] = useReducer(catalogReducer, {
    data: null,
    loading: false,
    error: null
  })

  const loadData = useCallback(async () => {
    dispatch({type: "FETCH_START"})
    try {
      const data = await CatalogService.fetchCatalog()
      dispatch({ type: "FETCH_SUCCESS", payload: data})
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", payload: (err as Error).message })
    }
  }, [])

  // trigger fetch on mount
  useEffect(() => {
    loadData().then()
  }, [loadData]);

  return { ...state, refresh: loadData }
}
