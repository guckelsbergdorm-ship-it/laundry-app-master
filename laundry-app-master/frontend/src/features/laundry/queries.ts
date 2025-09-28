import {type QueryClient, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {type Booking, type Machine, type LaundrySlotOverride} from "./models.tsx";
import {fetchJsonWithCredentialsOrThrow, fetchWithCredentials, toLocalDate} from "../../utils.ts";

async function invalidateBookings(qc: QueryClient) {
  await qc.invalidateQueries({queryKey: ['laundryBookingsByDate']});
  await qc.invalidateQueries({queryKey: ['laundryBookingsAfterToday']});
  await qc.invalidateQueries({queryKey: ['userLaundryBookingsInTheFuture']});
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({date, machineName, slot}: { date: Date, machineName: string, slot: number }) => {
      const localDate = toLocalDate(date);
      const res = await fetchWithCredentials(`/api/laundry/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          machineName: machineName,
          date: localDate,
          slotStart: slot,
        })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to book slot: ${text} (${res.status})`);
      }
    },
    onSuccess: async () => await invalidateBookings(qc)
  });
}

export function useCreateBatchBookings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookings: { date: Date, machineName: string, slot: number }[]) => {
      const bookingsData = [];
      for (const booking of bookings) {
        bookingsData.push({
          machineName: booking.machineName,
          date: toLocalDate(booking.date),
          slotStart: booking.slot,
        });
      }
      const res = await fetchWithCredentials(`/api/laundry/bookings/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingsData),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to book all slots: ${text} (${res.status})`);
      }
    },
    onSuccess: async () => await invalidateBookings(qc)
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await fetchWithCredentials(`/api/laundry/bookings?id=${bookingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to delete booking: ${text} (${res.status})`);
      }
    },
    onSuccess: async () => await invalidateBookings(qc)
  });
}

export const useBookingsAfterToday = () => {
  return useQuery<Booking[]>({
    queryKey: ['laundryBookingsAfterToday'],
    queryFn: () => fetchJsonWithCredentialsOrThrow<Booking[]>('/api/laundry/bookings/today'),
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchInterval: 1000 * 30,
  });
}

export const useUserBookingsInTheFuture = () => {
  return useQuery<Booking[]>({
    queryKey: ['userLaundryBookingsInTheFuture'],
    queryFn: () => fetchJsonWithCredentialsOrThrow<Booking[]>('/api/laundry/bookings/future/me'),
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });
}

export const useUserBookings = (page: number, size: number) => {
  return useQuery<Booking[]>({
    queryKey: ['userLaundryBookings', page, size],
    queryFn: () => fetchJsonWithCredentialsOrThrow<Booking[]>(`/api/laundry/bookings/all/me?page=${page}&size=${size}`),
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });
}

export const useBookingsByDate = (date: Date, includeBuffer: boolean = true) => {
  const localDate = toLocalDate(date);
  return useQuery<Booking[]>({
    queryKey: ['laundryBookingsByDate', localDate],
    queryFn: () => fetchJsonWithCredentialsOrThrow(`/api/laundry/bookings/date/${localDate}?includeBuffer=${includeBuffer}`),
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchInterval: 1000 * 30,
  });
}

export function useMachines() {
  return useQuery<Machine[]>({
    queryKey: ['machines'],
    queryFn: async () =>
      (await fetchJsonWithCredentialsOrThrow(`/api/laundry/machines`) as Machine[])
        .sort((a, b) => a.name.localeCompare(b.name)),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLaundryOverrides(date: Date) {
  const localDate = toLocalDate(date);
  return useQuery<LaundrySlotOverride[]>({
    queryKey: ['laundryOverrides', localDate],
    queryFn: () => fetchJsonWithCredentialsOrThrow<LaundrySlotOverride[]>(
      `/api/laundry/overrides?from=${localDate}&to=${localDate}`
    ),
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchInterval: 1000 * 60,
  });
}

export function useLaundryOverridesRange(from: Date, to: Date, machineName?: string) {
  const fromDate = toLocalDate(from);
  const toDate = toLocalDate(to);
  const queryKey = ['laundryOverridesRange', fromDate, toDate, machineName ?? 'ALL'];
  const params = new URLSearchParams({from: fromDate, to: toDate});
  if (machineName) {
    params.set('machineName', machineName);
  }
  return useQuery<LaundrySlotOverride[]>({
    queryKey,
    queryFn: () => fetchJsonWithCredentialsOrThrow<LaundrySlotOverride[]>(`/api/laundry/overrides?${params}`),
    staleTime: 1000 * 60,
    refetchOnMount: true,
  });
}

export function useCreateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (machine: Machine) => {
      const res = await fetchWithCredentials('/api/laundry/machines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(machine),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create machine: ${text}`);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['machines']});
    }
  })
}

export function useDeleteMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (machineName: string) => {
      const res = await fetchWithCredentials(`/api/laundry/machines?name=${machineName}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to delete machine: ${text}`);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['machines']});
    }
  });
}

export function useCreateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      machineName: string,
      status: 'BLOCKED' | 'EXTENDED',
      startDate: string,
      endDate: string,
      startSlot: number | null,
      endSlot: number | null,
    }) => {
      const res = await fetchWithCredentials('/api/laundry/overrides', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create override: ${text}`);
      }
      return await res.json() as LaundrySlotOverride;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['laundryOverrides']});
      await qc.invalidateQueries({queryKey: ['laundryOverridesRange']});
      await invalidateBookings(qc);
    }
  });
}

export function useUpdateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, ...payload}: {id: number, status?: string, startDate?: string, endDate?: string, startSlot?: number | null, endSlot?: number | null}) => {
      const res = await fetchWithCredentials(`/api/laundry/overrides/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to update override: ${text}`);
      }
      return await res.json() as LaundrySlotOverride;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['laundryOverrides']});
      await qc.invalidateQueries({queryKey: ['laundryOverridesRange']});
      await invalidateBookings(qc);
    }
  });
}

export function useDeleteOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetchWithCredentials(`/api/laundry/overrides/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to delete override: ${text}`);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['laundryOverrides']});
      await qc.invalidateQueries({queryKey: ['laundryOverridesRange']});
      await invalidateBookings(qc);
    }
  });
}
