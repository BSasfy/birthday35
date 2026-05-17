import { readFile } from "fs/promises";
import path from "path";

const guestsPath = path.join(process.cwd(), "data", "guests.json");

try {
  const raw = await readFile(guestsPath, "utf-8");
  JSON.parse(raw);
  console.log(
    "Add this to Vercel → Settings → Environment Variables as GUESTS_JSON:\n",
  );
  console.log(JSON.stringify(JSON.parse(raw)));
} catch (error) {
  console.error("Could not read data/guests.json:", error.message);
  process.exit(1);
}
