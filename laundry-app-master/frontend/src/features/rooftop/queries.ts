import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchJsonWithCredentialsOrThrow, fetchWithCredentials, toLocalDate} from "../../utils.ts";
import type {RooftopBooking, RooftopBookingRequest, RooftopRequestDecision} from "./models.ts";

export const useBookingsByMonth = (date: Date) => {
  const dateString = toLocalDate(date);
  return useQuery<RooftopBooking[]>({
    queryKey: ['rooftopBookingsByMonth', dateString],
    queryFn: () => fetchJsonWithCredentialsOrThrow(`/api/rooftop/bookings/month/${dateString}`),
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchInterval: 1000 * 30,
  });
}

export const useMyBookingRequests = (params?: {status?: RooftopBookingRequest['status'], from?: Date, to?: Date}) => {
  const search = new URLSearchParams();
  if (params?.status) {
    search.set('status', params.status);
  }
  if (params?.from) {
    search.set('from', toLocalDate(params.from));
  }
  if (params?.to) {
    search.set('to', toLocalDate(params.to));
  }
  const suffix = search.toString();
  return useQuery<RooftopBookingRequest[]>({
    queryKey: ['rooftopRequests', suffix],
    queryFn: () => fetchJsonWithCredentialsOrThrow(`/api/rooftop/bookings/requests/me${suffix ? `?${suffix}` : ''}`),
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchInterval: 1000 * 60,
  });
}

export const usePendingBookingRequests = (filters?: {from?: Date, to?: Date, bookerRoom?: string, status?: RooftopBookingRequest['status']}) => {
  const search = new URLSearchParams();
  if (filters?.status) {
    search.set('status', filters.status);
  }
  if (filters?.from) {
    search.set('from', toLocalDate(filters.from));
  }
  if (filters?.to) {
    search.set('to', toLocalDate(filters.to));
  }
  if (filters?.bookerRoom) {
    search.set('bookerRoom', filters.bookerRoom);
  }
  const suffix = search.toString();
  return useQuery<RooftopBookingRequest[]>({
    queryKey: ['adminRooftopRequests', suffix],
    queryFn: () => fetchJsonWithCredentialsOrThrow(`/api/rooftop/bookings/requests${suffix ? `?${suffix}` : ''}`),
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchInterval: 1000 * 30,
  });
}

export const useApproveBookingRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, decision}: {id: number, decision?: RooftopRequestDecision}) => {
      const res = await fetchWithCredentials(`/api/rooftop/bookings/requests/${id}/approve`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: decision ? JSON.stringify(decision) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to approve request: ${text} (${res.status})`);
      }
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['rooftopBookingsByMonth'] });
      await qc.invalidateQueries({ queryKey: ['rooftopRequests'] });
      await qc.invalidateQueries({ queryKey: ['adminRooftopRequests'] });
    }
  })
}

export const useRejectBookingRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, decision}: {id: number, decision: RooftopRequestDecision}) => {
      const res = await fetchWithCredentials(`/api/rooftop/bookings/requests/${id}/reject`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(decision),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to reject request: ${text} (${res.status})`);
      }
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['rooftopRequests']});
      await qc.invalidateQueries({queryKey: ['adminRooftopRequests']});
    }
  });
}

export const useCancelBookingRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetchWithCredentials(`/api/rooftop/bookings/requests/${id}/cancel`, {
        method: 'POST'
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to cancel request: ${text} (${res.status})`);
      }
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['rooftopRequests']});
      await qc.invalidateQueries({queryKey: ['rooftopBookingsByMonth']});
    }
  });
}

export const useMyRooftopBookings = (params?: {from?: Date, to?: Date}) => {
  const search = new URLSearchParams();
  if (params?.from) {
    search.set('from', toLocalDate(params.from));
  }
  if (params?.to) {
    search.set('to', toLocalDate(params.to));
  }
  const suffix = search.toString();
  return useQuery<RooftopBooking[]>({
    queryKey: ['myRooftopBookings', suffix],
    queryFn: () => fetchJsonWithCredentialsOrThrow(`/api/rooftop/bookings/me${suffix ? `?${suffix}` : ''}`),
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });
}

export const useAdminRooftopBookings = (params?: {from?: Date, to?: Date, bookerRoom?: string}) => {
  const search = new URLSearchParams();
  if (params?.from) {
    search.set('from', toLocalDate(params.from));
  }
  if (params?.to) {
    search.set('to', toLocalDate(params.to));
  }
  if (params?.bookerRoom) {
    search.set('bookerRoom', params.bookerRoom);
  }
  const suffix = search.toString();
  return useQuery<RooftopBooking[]>({
    queryKey: ['adminRooftopBookings', suffix],
    queryFn: () => fetchJsonWithCredentialsOrThrow(`/api/rooftop/bookings${suffix ? `?${suffix}` : ''}`),
    staleTime: 1000 * 60,
    refetchOnMount: true,
  });
}
