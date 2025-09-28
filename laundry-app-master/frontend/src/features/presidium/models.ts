export type PresidiumMember = {
  id: number;
  name: string;
  title: string;
  contact?: string | null;
  portraitUrl?: string | null;
  bio?: string | null;
  displayOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PresidiumPayload = {
  name: string;
  title: string;
  contact?: string | null;
  portraitUrl?: string | null;
  bio?: string | null;
  displayOrder?: number;
  visible?: boolean;
};