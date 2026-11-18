// Local save safety, so progress survives a bad write, a mistaken wipe or import,
// or a cloud merge the player regrets:
//  - every save keeps the previous good save as a mirror (<key>.prev)
//  - rolling backups: automatic snapshots plus "safety" snapshots taken before
//    anything replaces the current progress. Safety snapshots are kept longest.

const BACKUP_KEY = "bibiClickerBackups.v1";
const MAX_AUTO = 6;
const MAX_SAFETY = 10;

export function safeGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
export function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
}
export function safeRemove(key) {
  try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

// Write the save, keeping the previous one as a mirror
export function writeSave(key, str) {
  const prev = safeGet(key);
  if (prev && prev !== str) safeSet(`${key}.prev`, prev);
  return safeSet(key, str);
}
// The main save first, then the mirror
export function saveCandidates(key) {
  return [safeGet(key), safeGet(`${key}.prev`)].filter(Boolean);
}

export function listBackups() {
  try {
    const list = JSON.parse(safeGet(BACKUP_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

// kind: "auto" (periodic) or "safety" (taken before something replaces progress)
export function addBackup(save, summary, reason, kind = "safety") {
  if (!save) return false;
  const list = listBackups();
  if (list.length && list[0].save === save) return true; // nothing changed since the last one
  list.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, t: Date.now(), kind, reason, summary, save });
  const prune = (k, max) => {
    let n = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].kind !== k) continue;
      if (++n > max) { list.splice(i, 1); i--; }
    }
  };
  prune("auto", MAX_AUTO);
  prune("safety", MAX_SAFETY);
  // If storage is full, drop the oldest automatic backups first, then the oldest of any kind
  while (!safeSet(BACKUP_KEY, JSON.stringify(list))) {
    if (list.length <= 1) return false;
    const idx = list.map((b) => b.kind).lastIndexOf("auto");
    list.splice(idx > 0 ? idx : list.length - 1, 1);
  }
  return true;
}
