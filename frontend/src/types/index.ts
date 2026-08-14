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
  occupiedSeats?: string[];
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | string;
};

export type Ticket = {
  id: string;
  reservationId: string;
  code: string;
  usedAt?: string | null;
  event: Event;
  quantity: number;
  seatSelection?: string[];
  qrDataUrl?: string;
  shareUrl?: string;
};
