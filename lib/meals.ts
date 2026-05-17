export type MealOption = {
  id: string;
  label: string;
  description?: string;
};

export const mealOptions = {
  main: [
    { id: "fish", label: "Fish & Chips" },
    { id: "haggis", label: "Haggis, Neeps & Tatties" },
    { id: "burger", label: "Double Cheeseburger with Chips" },
    { id: "steak", label: "Flat Iron Steak with Fries & Sauce" },
  ],
  dessert: [{ id: "cake", label: "There will be cake!" }],
} as const satisfies { main: MealOption[]; dessert: MealOption[] };

export const kidsMealOptions = {
  main: [
    {
      id: "toad-in-the-hole",
      label: "Toad in the Hole",
      description: "Pigs in blankets, yorkie, mash, peas and gravy",
    },
    {
      id: "fish-finger-roll",
      label: "Fish Finger Roll",
      description: "Shredded lettuce, mayo, fish finger, fries and peas",
    },
    {
      id: "wee-steak",
      label: "Wee steak and chips (gluten-free)",
      description: "Rump steak, fries and gravy",
    },
    {
      id: "slider-burger",
      label: "Slider Burger",
      description: "Cheeseburger, fries and ketchup",
    },
    {
      id: "popcorn-chicken",
      label: "Popcorn Chicken",
      description: "Crispy chicken bites, peas and fries",
    },
  ],
  dessert: [
    {
      id: "cookies-cream",
      label: "Cookies & Cream (Vegetarian)",
      description:
        "Cookies and ice cream, Oreos and chocolate sauce",
    },
    {
      id: "chocolate-brownie",
      label: "Chocolate Brownie (Vegetarian and gluten-free)",
      description:
        "Warm chocolate brownie, vanilla ice cream and chocolate sauce",
    },
    {
      id: "eton-mess",
      label: "Glasgow Eton Mess (gluten-free)",
      description:
        "Ice cream, marshmallow, meringue, raspberry sauce and hundreds & thousands",
    },
    {
      id: "no-dessert",
      label: "No dessert",
    },
  ],
} as const satisfies { main: MealOption[]; dessert: MealOption[] };

export const fixedDessert = mealOptions.dessert[0];

export type MealChoices = {
  main: string;
  dessert: string;
  dietaryNotes: string;
  allergies: string;
};

export type MenuType = "adult" | "kids";

export function getMenuOptions(menu: MenuType) {
  return menu === "kids" ? kidsMealOptions : mealOptions;
}
