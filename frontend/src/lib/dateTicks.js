// Custom date ticks for the time axis: full numeric dates (no "Dec 10"
// locale abbreviations), always showing the two endpoints plus month starts
// (or year starts on long ranges) in between, in a user-chosen format.

const DAY = 86400000;

export const DATE_ORDERS = ["dmy", "mdy", "ymd"];
export const SEPARATORS = ["/", "-", "."];
// A sample where day/month differ, so format-order options are self-explanatory.
export const SAMPLE_MS = new Date(2024, 7, 25).getTime(); // 25 Aug 2024

function pad(n) { return String(n).padStart(2, "0"); }

export function formatDate(ms, order = "dmy", sep = "/") {
  const d = new Date(ms);
  const dd = pad(d.getDate()), mm = pad(d.getMonth() + 1), yyyy = d.getFullYear();
  if (order === "ymd") return `${yyyy}${sep}${mm}${sep}${dd}`;
  if (order === "mdy") return `${mm}${sep}${dd}${sep}${yyyy}`;
  return `${dd}${sep}${mm}${sep}${yyyy}`;
}

// Naive ISO ("2024-08-25T00:00:00") built from LOCAL components — matches the
// backend's timezone-naive timestamps, so ticks stay aligned with the data
// regardless of the browser's timezone (never round-trips through UTC).
export function toNaiveISO(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const MONTH_STEPS = [1, 2, 3, 4, 6, 12, 24, 36, 60, 120];

// Tick positions (ms): always the two endpoints, plus month starts in between,
// calendar-aligned (Jan/Apr/… for quarterly, Jan for yearly) and thinned so the
// labels don't collide. Sub-month windows fall back to a few evenly-spaced days.
export function niceDateTicks(minMs, maxMs, target = 10) {
  const span = maxMs - minMs;
  if (!(span > 0)) return [minMs];

  const a = new Date(minMs), b = new Date(maxMs);
  const idxA = a.getFullYear() * 12 + a.getMonth();     // global month index
  const idxB = b.getFullYear() * 12 + b.getMonth();
  const totalMonths = idxB - idxA;

  let interior = [];
  if (totalMonths >= 1) {
    let stepM = MONTH_STEPS[MONTH_STEPS.length - 1];
    for (const s of MONTH_STEPS) { if (totalMonths / s <= target) { stepM = s; break; } }
    for (let idx = idxA; idx <= idxB; idx++) {
      if (idx % stepM !== 0) continue;                  // aligned to Jan
      const ms = new Date(Math.floor(idx / 12), idx % 12, 1).getTime();
      if (ms > minMs && ms < maxMs) interior.push(ms);
    }
  }
  if (interior.length === 0 && span / DAY > 4) {        // sub-month window
    const n = Math.min(6, Math.max(2, Math.floor(span / DAY / 4)));
    for (let k = 1; k < n; k++) {
      const d = new Date(minMs + (span * k) / n); d.setHours(0, 0, 0, 0);
      interior.push(d.getTime());
    }
  }

  const minGap = span * 0.035;                          // don't collide with endpoints
  interior = [...new Set(interior)].filter((t) => (t - minMs) > minGap && (maxMs - t) > minGap);
  return [minMs, ...interior, maxMs];
}
