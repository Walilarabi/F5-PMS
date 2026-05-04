export interface Channel {
  name: string;
  type: 'OTA' | 'Wholesaler' | 'TO' | 'GDS' | 'Meta' | 'Direct';
  code: string;
  color: string;
  icon: string;
  initials: string;
}

export const CHANNELS: Channel[] = [
  { name: "Booking.com", type: "OTA", code: "BOOKING", color: "#A5B4FC", icon: "booking", initials: "B" },
  { name: "Expedia", type: "OTA", code: "EXPEDIA", color: "#93C5FD", icon: "expedia", initials: "E" },
  { name: "Agoda", type: "OTA", code: "AGODA", color: "#FDE68A", icon: "building", initials: "Ag" },
  { name: "Airbnb", type: "OTA", code: "AIRBNB", color: "#FDA4AF", icon: "airbnb", initials: "A" },
  { name: "Hotels.com", type: "OTA", code: "HOTELS", color: "#FCA5A5", icon: "hotel", initials: "H" },
  { name: "Trip.com", type: "OTA", code: "TRIP", color: "#BAE6FD", icon: "globe", initials: "T" },
  { name: "Trivago", type: "Meta", code: "TRIVAGO", color: "#A5F3FC", icon: "search", initials: "Tr" },
  { name: "Hotelbeds", type: "Wholesaler", code: "HOTELBEDS", color: "#FBCFE8", icon: "warehouse", initials: "Hb" },
  { name: "Amadeus", type: "GDS", code: "AMADEUS", color: "#E0F2FE", icon: "terminal", initials: "Am" },
  { name: "Sabre", type: "GDS", code: "SABRE", color: "#FECACA", icon: "desktop", initials: "S" },
  { name: "Direct", type: "Direct", code: "DIRECT", color: "#A7F3D0", icon: "building", initials: "D" },
  { name: "TUI", type: "TO", code: "TUI", color: "#FFEDD5", icon: "plane", initials: "TU" },
  { name: "Jet2", type: "TO", code: "JET2", color: "#CFFAFE", icon: "suitcase", initials: "J2" }
];
