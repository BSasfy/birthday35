import { getMenuOptions, type MenuType } from "./meals";

export function mealLabel(
  id: string,
  field: "main" | "dessert",
  menu: MenuType = "adult",
): string {
  if (!id) return "—";
  const options = getMenuOptions(menu)[field];
  return options.find((option) => option.id === id)?.label ?? id;
}

export function formatSubmittedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
