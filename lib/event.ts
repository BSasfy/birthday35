export const event = {
  hostName: process.env.HOST_NAME ?? "Barbara",
  age: 35,
  date: process.env.EVENT_DATE ?? "Sunday, 12th of July, 2026",
  time: process.env.EVENT_TIME ?? "Arrival from 5:00 PM, dinner at 6:00 PM",
  location:
    process.env.EVENT_LOCATION ??
    "Iron Duke - Royal Exchange Square. We'll have the place to ourselves.",
  food:
    process.env.EVENT_FOOD ??
    "Dinner, a drink with your main and cake will be on me. Starters and further drinks will be available to purchase. If you have any dietary requirements, please let us know when you RSVP.",
  dressCode:
    process.env.EVENT_DRESS ??
    "Come as you are, but if you'd like to, dress up a bit or wear something sparkly!",
  giftsNote:
    process.env.EVENT_GIFTS ??
    "Your presence is enough — gifts are not required",
  rsvpDeadline: process.env.RSVP_DEADLINE ?? "26th of June, 2026",
} as const;
