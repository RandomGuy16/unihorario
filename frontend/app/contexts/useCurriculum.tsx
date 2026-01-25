"use client"
import { useCallback, useReducer, useContext, createContext, ReactNode } from 'react'
import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";
import { Course } from "@/app/models/Course";
import { CurriculumService } from "@/app/services/CurriculumService";
import {SubmitCurriculumResponse} from "@/app/models/dto";

// Define the shape of our state
interface CurriculumState {
  data: UniversityCurriculum | null;
  courseRegistry: Map<string, Course> | null;
  loading: boolean;
  error: string | null;
}

// Define possible actions
type CurriculumAction =
  | { type: 'FETCH_START'}
  | { type: 'FETCH_SUCCESS', payload: UniversityCurriculum }
  | { type: 'FETCH_ERROR', payload: string }


function curriculumReducer(state: CurriculumState, action: CurriculumAction) {
  switch (action.type) {
    case "FETCH_START":
      return {...state, loading: true, error: null}
    case "FETCH_SUCCESS":
      const registry = CurriculumService.createCourseRegistry(action.payload)
      return {
        ...state,
        loading: false,
        data: action.payload,
        courseRegistry: registry
      }
    case "FETCH_ERROR":
      return {...state, loading: false, error: action.payload}
    default:
      return state
  }
}

export function useCurriculumLoader() {
  const [state, dispatch] = useReducer(curriculumReducer, {
    data: null,
    courseRegistry: null,
    loading: false,
    error: null,
  })

  const loadData = useCallback(async (school: string) => {
    dispatch({type: "FETCH_START"})
    try {
      const data = await CurriculumService.fetchCurriculum(school)
      dispatch({ type: "FETCH_SUCCESS", payload: data })
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", payload: (err as Error).message })
    }
  }, [])

  // trigger fetch on mount
  /*
  useEffect(() => {
    loadData().then()
  }, [loadData]);
  */
  return { ...state, fetchCurriculum: loadData }
}

interface CurriculumContextType extends CurriculumState {
  fetchCurriculum: (school: string) => void;
  submitCurriculum: (file: File) => Promise<SubmitCurriculumResponse>;
}
const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined)

export function CurriculumContextProvider({ children }: { children: ReactNode }) {
  const curriculumState = useCurriculumLoader()
  return (
    <CurriculumContext.Provider value={{
      ...curriculumState,
      submitCurriculum: CurriculumService.submitCurriculumFile
    }}>
      {children}
    </CurriculumContext.Provider>
  )
}

export function useCurriculum() {
  const context = useContext(CurriculumContext)
  if (context === undefined) {
    throw new Error('useCurriculumContext must be used within a CurriculumProvider')
  }
  return context
}
