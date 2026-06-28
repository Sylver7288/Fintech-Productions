export interface Service {
  icon: string;
  label: string;
  route: string;
  color: string;
}

export const SERVICES: Service[] = [
  { icon: "phone", label: "Airtime & Data", route: "/airtime", color: "#FACC15" },
  { icon: "zap", label: "Pay Bills", route: "/bills", color: "#FACC15" },
  { icon: "repeat", label: "Scheduled", route: "/scheduled-transfers", color: "#FACC15" },
  { icon: "bar-chart-2", label: "Analytics", route: "/analytics", color: "#FACC15" },
  { icon: "credit-card", label: "Loans", route: "/loans", color: "#FACC15" },
  { icon: "globe", label: "FX Transfer", route: "/international-transfer", color: "#FACC15" },
  { icon: "gift", label: "Refer & Earn", route: "/referral", color: "#FACC15" },
  { icon: "camera", label: "Scan & Pay", route: "/qr-scanner", color: "#FACC15" },
  { icon: "users", label: "Split Bill", route: "/split-bill", color: "#FACC15" },
  { icon: "map-pin", label: "ATM Locator", route: "/atm-locator", color: "#FACC15" },
  { icon: "file-text", label: "Statement", route: "/statement", color: "#FACC15" },
];

export interface CategorizedService {
  label: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
  isDashedIconBorder?: boolean;
}

export interface ServiceCategory {
  title: string;
  items: CategorizedService[];
}

export const CATEGORIZED_SERVICES: ServiceCategory[] = [
  {
    title: "Recently Used",
    items: [
      { label: "Remit", icon: "globe", route: "/international-transfer", color: "#FACC15" },
      { label: "Products and Services", icon: "grid", route: "/bills", color: "#FACC15" },
      { label: "Solar", icon: "sun", route: "/bills", color: "#FACC15" },
      { label: "Travel & Hotel", icon: "umbrella", route: "/bills", color: "#FACC15" }
    ]
  },
  {
    title: "E-commerce",
    items: [
      { label: "AliExpress", icon: "shopping-bag", route: "/bills", color: "#FACC15" },
      { label: "Gift Cards", icon: "gift", route: "/bills", color: "#FACC15" },
      { label: "Chowdeck", icon: "truck", route: "/bills", color: "#FACC15" }
    ]
  },
  {
    title: "International Services",
    items: [
      { label: "Remit", icon: "globe", route: "/international-transfer", color: "#FACC15" }
    ]
  },
  {
    title: "Bills Payment",
    items: [
      { label: "Electricity", icon: "zap", route: "/bills", color: "#FACC15" },
      { label: "Solar", icon: "sun", route: "/bills", color: "#FACC15" },
      { label: "Products and Services", icon: "grid", route: "/bills", color: "#FACC15" },
      { label: "School & Exam", icon: "book-open", route: "/bills", color: "#FACC15" },
      { label: "Internet Services", icon: "wifi", route: "/airtime", color: "#FACC15" },
      { label: "Financial Services", icon: "dollar-sign", route: "/transfer", color: "#FACC15" },
      { label: "Invoice Payments", icon: "file-text", route: "/bills", color: "#FACC15" },
      { label: "Aid Grants and Donations", icon: "heart", route: "/bills", color: "#FACC15" },
      { label: "Religious", icon: "home", route: "/bills", color: "#FACC15" },
      { label: "Government Payments", icon: "flag", route: "/bills", color: "#FACC15" },
      { label: "Embassies", icon: "briefcase", route: "/bills", color: "#FACC15" },
      { label: "TV(Others)", icon: "tv", route: "/bills", color: "#FACC15" },
      { label: "Shopping", icon: "shopping-cart", route: "/bills", color: "#FACC15" },
      { label: "Online Shopping", icon: "shopping-bag", route: "/bills", color: "#FACC15" },
      { label: "Merchant Payments", icon: "pocket", route: "/bills", color: "#FACC15" },
      { label: "Blackberry", icon: "smartphone", route: "/bills", color: "#FACC15" },
      { label: "PayChoice", icon: "credit-card", route: "/bills", color: "#FACC15" },
      { label: "Commerce Retail Trade", icon: "package", route: "/bills", color: "#FACC15" },
      { label: "Prepaid Card Services", icon: "credit-card", route: "/(tabs)/cards", color: "#FACC15" },
      { label: "International Airtime", icon: "phone-call", route: "/airtime", color: "#FACC15" },
      { label: "Transport & Toll", icon: "truck", route: "/bills", color: "#FACC15" },
      { label: "Travel & Hotel", icon: "umbrella", route: "/bills", color: "#FACC15" }
    ]
  },
  {
    title: "Finance",
    items: [
      { label: "OWealth", icon: "trending-up", route: "/(tabs)/savings", color: "#FACC15" },
      { label: "Fixed", icon: "lock", route: "/(tabs)/savings", color: "#FACC15" },
      { label: "SafeBox", icon: "archive", route: "/(tabs)/savings", color: "#FACC15" },
      { label: "Targets", icon: "target", route: "/(tabs)/savings", color: "#FACC15" },
      { label: "Spend & Save", icon: "package", route: "/(tabs)/savings", color: "#FACC15" },
      { label: "BNPL", icon: "credit-card", route: "/loans", color: "#FACC15", badge: "HOT" }
    ]
  },
  {
    title: "Rewards",
    items: [
      { label: "Daily Check-In", icon: "calendar", route: "/referral", color: "#FACC15" },
      { label: "Play4aChild", icon: "heart", route: "/referral", color: "#FACC15" },
      { label: "Refer & Earn", icon: "users", route: "/referral", color: "#FACC15" }
    ]
  },
  {
    title: "Others",
    items: [
      { label: "Physical Card", icon: "credit-card", route: "/(tabs)/cards", color: "#FACC15" },
      { label: "Virtual Card", icon: "credit-card", route: "/(tabs)/cards", color: "#FACC15", isDashedIconBorder: true }
    ]
  }
];

