import {useQuery} from "@tanstack/react-query";
import {fetchJsonWithCredentialsOrThrow} from "../../utils.ts";
import type {DashboardSummary} from "./models.ts";

export const useDashboardSummary = (enabled = true) => {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: () => fetchJsonWithCredentialsOrThrow<DashboardSummary>('/api/dashboard/summary'),
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchInterval: 1000 * 60,
    enabled,
  });
};