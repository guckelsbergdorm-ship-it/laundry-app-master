import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchJsonWithCredentialsOrThrow, fetchWithCredentials} from "../../utils.ts";
import type {PresidiumMember, PresidiumPayload} from "./models.ts";

export const usePresidiumMembers = () => {
  return useQuery<PresidiumMember[]>({
    queryKey: ['presidiumMembers'],
    queryFn: () => fetchJsonWithCredentialsOrThrow('/api/presidium'),
    staleTime: 1000 * 60,
  });
};

export const useAllPresidiumMembers = () => {
  return useQuery<PresidiumMember[]>({
    queryKey: ['allPresidiumMembers'],
    queryFn: () => fetchJsonWithCredentialsOrThrow('/api/presidium/all'),
    staleTime: 1000 * 30,
  });
};

export const useCreatePresidiumMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PresidiumPayload) => {
      const res = await fetchWithCredentials('/api/presidium', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['presidiumMembers']});
      await qc.invalidateQueries({queryKey: ['allPresidiumMembers']});
    }
  });
};

export const useUpdatePresidiumMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({id, ...payload}: PresidiumPayload & {id: number}) => {
      const res = await fetchWithCredentials(`/api/presidium/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['presidiumMembers']});
      await qc.invalidateQueries({queryKey: ['allPresidiumMembers']});
    }
  });
};

export const useDeletePresidiumMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetchWithCredentials(`/api/presidium/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['presidiumMembers']});
      await qc.invalidateQueries({queryKey: ['allPresidiumMembers']});
    }
  });
};