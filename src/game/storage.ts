const HS_KEY = "mh_highscore_v1";
const BG_KEY = "mh_badges_v1";
const MU_KEY = "mh_muted_v1";

export interface ScoreEntry {
  score: number;
  stars: number;
  mistakes: number;
  time: number; // seconds
  date: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadHighScores(): ScoreEntry[] {
  const stored = read<unknown>(HS_KEY, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter((entry): entry is ScoreEntry => {
    if (!entry || typeof entry !== "object") return false;
    const e = entry as Partial<ScoreEntry>;
    return [e.score, e.stars, e.mistakes, e.time, e.date].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0)
      && (e.stars ?? 0) <= 3;
  }).sort((a, b) => b.score - a.score || a.time - b.time).slice(0, 5);
}

/** Returns 1-based rank of the entry (best first), or -1 if not in top 5. */
export function saveHighScore(entry: ScoreEntry): { rank: number; isBest: boolean } {
  const list = loadHighScores();
  list.push(entry);
  list.sort((a, b) => b.score - a.score || a.time - b.time);
  const top = list.slice(0, 5);
  write(HS_KEY, top);
  const rank = top.indexOf(entry) + 1;
  return { rank: rank || -1, isBest: rank === 1 };
}

export function loadUnlockedBadges(): string[] {
  const stored = read<unknown>(BG_KEY, []);
  return Array.isArray(stored) ? [...new Set(stored.filter((id): id is string => typeof id === "string"))] : [];
}

export function unlockBadges(ids: string[]): string[] {
  const set = new Set(loadUnlockedBadges());
  ids.forEach((id) => set.add(id));
  const all = [...set];
  write(BG_KEY, all);
  return all;
}

export function loadMuted(): boolean {
  return read<unknown>(MU_KEY, false) === true;
}
export function saveMuted(m: boolean) {
  write(MU_KEY, m);
}

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
