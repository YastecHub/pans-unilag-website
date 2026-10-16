import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/http.ts'
import { type GradingScale, LOCAL_SCALE } from './model/scale.ts'

/**
 * The active grading scale from GET /api/grading-scale. The calculator works straight away with the
 * bundled copy and switches to the API's scale once it loads; if the API fails, it keeps the copy.
 */
export function useGradingScale(): { scale: GradingScale; fromApi: boolean } {
  const query = useQuery({
    queryKey: ['grading-scale'],
    queryFn: ({ signal }) => api.get<GradingScale>('/api/grading-scale', signal),
    staleTime: 60 * 60_000,
  })
  return { scale: query.data ?? LOCAL_SCALE, fromApi: query.isSuccess }
}
