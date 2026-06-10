import { normalizeRecord } from "./normalize.js";

export function parseCsv(text) {
  const rows = [];
  let current = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      current.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      current.push(cell);
      if (current.some((value) => value.trim() !== "")) rows.push(current);
      current = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  current.push(cell);
  if (current.some((value) => value.trim() !== "")) rows.push(current);

  const headers = rows.shift() || [];
  return rows
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])))
    .map(normalizeRecord);
}

export async function loadRefereeCsv(path = "./data/nbastuffer-nba-referee-stats-2016-2026.csv") {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load referee CSV: ${response.status}`);
  }
  return parseCsv(await response.text()).filter((record) => record.referee && record.season);
}
