export type RooftopBooking = {
  id: number;
  bookerRoomNumber: string;
  date: string;
  reason?: string | null;
}

export type RooftopBookingRequest = {
  id: number;
  bookerRoomNumber: string;
  date: string;
  createdAt: string;
  reason: string;
  contact: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedByRoomNumber: string | null;
  reviewedAt: string | null;
  decisionReason: string | null;
  timeSpan: string;
}

export type RooftopRequestDecision = {
  reason?: string;
}
