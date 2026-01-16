import { useCallback, useEffect, useReducer } from 'react'
import { UniversityCurriculum } from "@/app/models/UniversityCurriculum";
import { Course } from "@/app/models/Course";
import { CurriculumService } from "@/app/services/CurriculumService";

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

export function useCurriculum() {
  const [state, dispatch] = useReducer(curriculumReducer, {
    data: null,
    courseRegistry: null,
    loading: false,
    error: null,
  })

  const loadData = useCallback(async () => {
    dispatch({type: "FETCH_START"})
    try {
      const data = await CurriculumService.fetchCurriculum()
      dispatch({ type: "FETCH_SUCCESS", payload: data })
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