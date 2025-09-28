
export type Role = 'USER' | 'STAFF' | 'LAUNDRY_ADMIN' | 'ROOFTOP_ADMIN' | 'MASTER_ADMIN';

export const ROLES = ['USER', 'STAFF', 'LAUNDRY_ADMIN', 'ROOFTOP_ADMIN', 'MASTER_ADMIN'] as const;

export type UserData = {
  status?: 'AUTHENTICATED',
  roomNumber: string,
  role: Role
}

export type User = {
  roomNumber: string,
  password?: string,
  role: Role,
  lastBookingActivity: string | null,
  maxWasherMinutesPerWeek: number | null,
  maxDryerMinutesPerWeek: number | null,
}

export const DEFAULT_DOUBLE_OCCUPANCY_ROOMS = ['00', '01', '04', '05', '08', '09'] as const;

export type GeneratedUserCredential = {
  roomNumber: string,
  password: string | null,
  status: 'CREATED' | 'UPDATED' | 'SKIPPED_EXISTS' | 'PREVIEW',
}

export type BulkGenerationResponse = {
  credentials: GeneratedUserCredential[],
  created: number,
  updated: number,
  skipped: number,
}

export type BulkGenerationPayload = {
  rooms: string[],
  passwordLength?: number,
  overwriteExisting?: boolean,
  role?: Role,
  maxWasherMinutesPerWeek?: number,
  maxDryerMinutesPerWeek?: number,
}
