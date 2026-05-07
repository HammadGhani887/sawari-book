export interface ExpenseCategory {
  id: string;
  name: string;
  nameUrdu: string;
  emoji: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "fuel",        name: "Fuel",         nameUrdu: "تیل",          emoji: "⛽" },
  { id: "maintenance", name: "Maintenance",  nameUrdu: "مرمت",         emoji: "🔧" },
  { id: "oil_change",  name: "Oil Change",   nameUrdu: "آئل چینج",     emoji: "🛢️" },
  { id: "tyre",        name: "Tyre",         nameUrdu: "ٹائر",         emoji: "🔘" },
  { id: "wash",        name: "Car Wash",     nameUrdu: "گاڑی دھونا",   emoji: "💧" },
  { id: "fine",        name: "Fine / Challan", nameUrdu: "جرمانہ",     emoji: "⚠️" },
  { id: "insurance",   name: "Insurance",    nameUrdu: "انشورنس",      emoji: "🛡️" },
  { id: "token_tax",   name: "Token Tax",    nameUrdu: "ٹوکن ٹیکس",   emoji: "📋" },
  { id: "other",       name: "Other",        nameUrdu: "دیگر",         emoji: "📦" },
];

export const CATEGORY_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.id, c])
);
