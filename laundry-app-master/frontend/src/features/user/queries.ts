import {type QueryClient, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchWithCredentials} from "../../utils.ts";
import type {
  BulkGenerationPayload,
  BulkGenerationResponse,
  Role,
  User,
  UserData
} from "./models.ts";

type LoginStatus = 'AUTHENTICATED' | 'UNAUTHENTICATED';

export const useUserData = () => {
  return useQuery({
    queryKey: ['userData'],
    queryFn: async () => {
      const res = await fetchWithCredentials(`/auth/status`);
      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await res.json() as { status: LoginStatus } | UserData;
      if (data.status !== 'AUTHENTICATED') {
        throw new Error('User not authenticated');
      }
      return data as UserData;
    },
    staleTime: 1000 * 60,
  });
}

export function invalidateUserData(queryClient: QueryClient) {
  queryClient.removeQueries({queryKey: ['userData']});
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async ({roomNumber, password}: { roomNumber: string, password: string }) => {
      const res = await fetchWithCredentials(`/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({roomNumber, password}),
      })
      if (!res.ok) {
        throw new Error(String(res.body));
      }
      return true;
    },
  });
}

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await fetchWithCredentials(`/api/users/all`);
      if (!res.ok) {
        throw new Error('Failed to fetch all users');
      }
      const data = await res.json() as User[];
      return data;
    },
    staleTime: 1000 * 60,
  });
}

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({roomNumber, password, role}: { roomNumber: string, password: string, role: Role }) => {
      const res = await fetchWithCredentials(`/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({roomNumber, password, role}),
      })
      if (!res.ok) {
        throw new Error(String(res.body));
      }
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['allUsers']});
    }
  })
}

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: User) => {
      const res = await fetchWithCredentials(`/api/users/${user.roomNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      })
      if (!res.ok) {
        throw new Error(String(res.body));
      }
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['allUsers']});
    }
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roomNumber: string) => {
      const res = await fetchWithCredentials(`/api/users/${roomNumber}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error(String(res.body));
      }
      return true;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({queryKey: ['allUsers']});
    }
  });
}

export const useBulkGenerateUsers = () => {
  return useMutation({
    mutationFn: async (payload: BulkGenerationPayload): Promise<BulkGenerationResponse> => {
      const res = await fetchWithCredentials(`/api/users/bulk/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to generate accounts');
      }
      return await res.json() as BulkGenerationResponse;
    }
  });
}
