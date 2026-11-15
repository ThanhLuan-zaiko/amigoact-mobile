// The date picker works with Date objects in the phone's time zone. The forms
// keep the web input text, a wall-clock time with no zone. These helpers move
// between the two by reading and writing the clock fields only, so the time
// the viewer picks is the time in the text, wherever the phone is.

const pad = (value: number) => String(value).padStart(2, "0");

const FORMAT = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

export function toWallClock(value: string): Date | null {
  const match = FORMAT.exec(value);
  if (!match) return null;
  const [, year, month, day, hour = "0", minute = "0"] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
}

export function fromWallClock(date: Date, mode: "date" | "datetime"): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return mode === "date"
    ? day
    : `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "15/11/2026" or "15/11/2026 08:30", the order Vietnamese readers expect.
export function showWallClock(value: string): string {
  const match = FORMAT.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  const date = `${day}/${month}/${year}`;
  return hour ? `${date} ${hour}:${minute}` : date;
}
