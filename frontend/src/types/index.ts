export type Role = "ORGANIZER" | "CUSTOMER" | "GATE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Event = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  date: string;
  location: string;
  capacity: number;
  available: number;
  priceInCents: number;
  status: string;
};

export type Ticket = {
  id: string;
  code: string;
  usedAt?: string | null;
  event: Event;
  quantity: number;
  qrDataUrl?: string;
  shareUrl?: string;
};
