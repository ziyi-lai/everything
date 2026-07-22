// Preset transaction categories (YNAB-style: a short fixed list keeps quick
// entry fast; the `category` column is free TEXT, so custom values still work).
export const EXPENSE_CATEGORIES = [
  { name: "Food & Dining", emoji: "🍔" },
  { name: "Transport", emoji: "🚗" },
  { name: "Entertainment", emoji: "🎬" },
  { name: "Shopping", emoji: "🛍" },
  { name: "Bills", emoji: "📄" },
  { name: "Health", emoji: "💊" },
  { name: "Others", emoji: "📦" },
] as const;

export const INCOME_CATEGORIES = [
  { name: "Salary", emoji: "💼" },
  { name: "Freelance", emoji: "💻" },
  { name: "Investment", emoji: "📈" },
  { name: "Gift", emoji: "🎁" },
  { name: "Others", emoji: "📦" },
] as const;

export function categoryEmoji(category: string): string {
  const match = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find((c) => c.name === category);
  return match?.emoji ?? "•";
}
