export interface Service {
  icon: string;
  label: string;
  route: string;
  color: string;
}

export const SERVICES: Service[] = [
  { icon: "phone", label: "Airtime & Data", route: "/airtime", color: "#00B894" },
  { icon: "zap", label: "Pay Bills", route: "/bills", color: "#FDCB6E" },
  { icon: "repeat", label: "Scheduled", route: "/scheduled-transfers", color: "#6C5CE7" },
  { icon: "bar-chart-2", label: "Analytics", route: "/analytics", color: "#0984E3" },
  { icon: "credit-card", label: "Credit", route: "/loans", color: "#E17055" },
  { icon: "globe", label: "FX Transfer", route: "/international-transfer", color: "#2D3436" },
  { icon: "gift", label: "Refer & Earn", route: "/referral", color: "#E84393" },
  { icon: "camera", label: "Scan & Pay", route: "/qr-scanner", color: "#6C5CE7" },
  { icon: "users", label: "Split Bill", route: "/split-bill", color: "#00B894" },
  { icon: "map-pin", label: "ATM Locator", route: "/atm-locator", color: "#0984E3" },
  { icon: "file-text", label: "Statement", route: "/statement", color: "#636E72" },
];
