"use client"
import { useCallback, useReducer, useContext, createContext, ReactNode } from 'react'
import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";
import { Course } from "@/app/models/Course";
import { CurriculumService } from "@/app/services/CurriculumService";
import {SubmitCurriculumResponse} from "@/app/models/dto";

// Define the shape of our state
interface CurriculumState {
  data: UniversityCurriculum | null;
  coursesPayload: Map<string, Course> | null;
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
      const fetchedCourses = CurriculumService.createCourses(action.payload)
      return {
        ...state,
        loading: false,
        data: action.payload,
        coursesPayload: fetchedCourses
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
    coursesPayload: null,
    loading: false,
    error: null,
  })

  const _handleFetch = useCallback(async (fetchFn: () => Promise<UniversityCurriculum>,) => {
    dispatch({type: "FETCH_START"})
    try {
      const data = await fetchFn()
      dispatch({ type: "FETCH_SUCCESS", payload: data })
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", payload: (err as Error).message })
    }
  }, [])

  const loadData = useCallback(async (school: string) => {
    await _handleFetch(() => CurriculumService.fetchCurriculum(school))
  }, [_handleFetch])

  const awaitDataParsing = useCallback(async (curriculumCreationJobId: string) => {
    await _handleFetch(() => CurriculumService.awaitCurriculumParsing(curriculumCreationJobId))
  }, [_handleFetch])

  // trigger fetch on mount
  /*
  useEffect(() => {
    loadData().then()
  }, [loadData]);
  */
  return {
    ...state,
    fetchCurriculum: loadData,
    submitCurriculum: CurriculumService.submitCurriculumFile,
    awaitCurriculumParsing: awaitDataParsing }
}

interface CurriculumContextType extends CurriculumState {
  fetchCurriculum: (school: string) => void;
  awaitCurriculumParsing: (curriculumCreationJobId: string) => Promise<void>;
  submitCurriculum: (file: File) => Promise<SubmitCurriculumResponse>;
}
const CurriculumContext = createContext<CurriculumContextType | undefined>(undefined)

export function CurriculumContextProvider({ children }: { children: ReactNode }) {
  const curriculumState = useCurriculumLoader()
  return (
    <CurriculumContext.Provider value={curriculumState}>
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
