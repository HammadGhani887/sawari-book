export interface Platform {
  id: string;
  name: string;
  nameUrdu: string;
  color: string;
}

export const PLATFORMS: Platform[] = [
  { id: "indrive", name: "inDrive",  nameUrdu: "اِن ڈرائیو", color: "#2DB543" },
  { id: "yango",   name: "Yango",   nameUrdu: "یانگو",       color: "#FFC107" },
  { id: "other",   name: "Other",   nameUrdu: "دیگر",        color: "#64748B" },
  { id: "private", name: "Private", nameUrdu: "پرائیویٹ",   color: "#3B82F6" },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));
