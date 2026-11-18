// Public leaderboard. Signed-in players opt in by choosing a nickname; only that nickname
// and three scores are published (never an email). Entries are refreshed when the
// account syncs, at most every few minutes unless seats changed.

const BOARDS = [
  { field: "allTimeVotes", label: "Votes", long: "Most votes, all time", icon: "ballot" },
  { field: "seats", label: "Seats", long: "Most Knesset seats", icon: "chair" },
  { field: "bestVps", label: "Votes/sec", long: "Best votes per second", icon: "startup" },
];
const NAME_RE = /^[\p{L}\p{N} _.\-]{3,20}$/u;
// A small filter for names that impersonate staff or are obviously offensive
const BLOCKED = ["admin", "moderator", "official", "support", "fuck", "shit", "bitch", "cunt", "nigg", "fag", "whore", "slut", "nazi", "hitler", "rape", "kike", "porn", "retard"];
const WRITE_EVERY_MS = 5 * 60 * 1000;
const MEDALS = ["medal", "medalSilver", "medalBronze"];

export function initLeaderboard({ account, stats, fmt, fmtBig, esc, toast, img }) {
  const box = document.getElementById("leaders");
  let board = "allTimeVotes", rows = [], loadedAt = 0, myEntry = null, myRank = null, total = 0;
  let editing = false, error = "", loading = false, visible = false, lastWrite = 0, lastSeats = -1, busy = false;

  const value = (field, v) => (field === "allTimeVotes" ? fmtBig(v || 0) : field === "bestVps" ? `${fmt(v || 0)}/s` : fmt(v || 0));
  const friendly = (e) => (e && e.code === "permission-denied"
    ? "The leaderboard isn't switched on yet: the game's database rules need updating."
    : e && (e.code === "unavailable" || /offline|network/i.test(e.message || "")) ? "Couldn't reach the leaderboard. Check your connection." : "Couldn't load the leaderboard right now.");

  function validName(name) {
    if (!NAME_RE.test(name)) return "Use 3 to 20 letters, numbers, spaces, dots, dashes or underscores.";
    const low = name.toLowerCase().replace(/[^a-z]/g, "");
    if (BLOCKED.some((w) => low.includes(w))) return "Please choose a different name.";
    return "";
  }

  async function load(force = false) {
    const cloud = account.cloud;
    if (!cloud) return render();
    if (!force && Date.now() - loadedAt < 30000 && rows.length) return render();
    loading = true; error = ""; render();
    try {
      const [top, count] = await Promise.all([cloud.top(board, 50), cloud.total()]);
      rows = top; total = count; loadedAt = Date.now();
      myRank = null;
      if (account.user && myEntry) {
        const inTop = rows.findIndex((r) => r.uid === account.user.uid);
        myRank = inTop >= 0 ? inTop + 1 : await cloud.rank(board, myEntry[board] || 0);
      }
    } catch (e) {
      console.warn("Leaderboard load failed", e);
      error = friendly(e);
    }
    loading = false;
    render();
  }

  async function loadMine() {
    const cloud = account.cloud;
    myEntry = null;
    if (!cloud || !account.user) return render();
    try { myEntry = await cloud.myEntry(); } catch (e) { console.warn(e); }
    if (myEntry) maybeWrite(true);
    if (visible) load(true); else render();
  }

  async function maybeWrite(force = false) {
    const cloud = account.cloud;
    if (!cloud || !account.user || !myEntry) return;
    const s = stats();
    if (!force && Date.now() - lastWrite < WRITE_EVERY_MS && s.seats === lastSeats) return;
    try {
      await cloud.setEntry({ name: myEntry.name, ...s });
      myEntry = { ...myEntry, ...s };
      lastWrite = Date.now(); lastSeats = s.seats;
    } catch (e) { console.warn("Leaderboard update failed", e); }
  }

  async function join(name) {
    const problem = validName(name);
    if (problem) { error = problem; return render(); }
    busy = true; error = ""; render();
    try {
      const s = stats();
      await account.cloud.setEntry({ name, ...s });
      const wasNew = !myEntry;
      myEntry = { name, ...s };
      lastWrite = Date.now(); lastSeats = s.seats;
      editing = false;
      toast(wasNew ? "You're on the leaderboard!" : "Name updated", `Playing as ${name}.`, "medal", "gold");
      busy = false;
      await load(true);
    } catch (e) {
      busy = false;
      error = friendly(e);
      render();
    }
  }

  async function leave() {
    busy = true; render();
    try {
      await account.cloud.removeEntry();
      myEntry = null; myRank = null;
      toast("Left the leaderboard", "Your name and scores were removed.", "medal");
    } catch (e) { error = friendly(e); }
    busy = false;
    load(true);
  }

  function meBox() {
    if (!account.cloud && !account.user) {
      return `<div class="lb-me"><p class="muted">The leaderboard needs accounts, and sign-in isn't available right now.</p></div>`;
    }
    if (!account.user) {
      return `<div class="lb-me"><p>Sign in to put your campaign on the leaderboard.</p><button class="btn btn-primary" data-act="signin">Sign in or create an account</button></div>`;
    }
    if (!myEntry || editing) {
      return `<div class="lb-me"><form class="lb-form" data-act="join"><label>${myEntry ? "New nickname" : "Choose a nickname to join"}
        <input id="lb-name" maxlength="20" autocomplete="nickname" value="${esc(myEntry ? myEntry.name : "")}" placeholder="e.g. FalafelFan"></label>
        <button class="btn btn-primary" type="submit" ${busy ? "disabled" : ""}>${myEntry ? "Save name" : "Join the leaderboard"}</button>
        ${myEntry ? `<button class="btn" type="button" data-act="cancel">Cancel</button>` : ""}</form>
        <p class="muted small">Only your nickname and scores are shown, never your email.</p></div>`;
    }
    return `<div class="lb-me"><p>You're on the leaderboard as <b>${esc(myEntry.name)}</b>${myRank ? `, ranked <b>#${fmt(myRank)}</b>` : ""}.</p>
      <div class="lb-me-actions"><button class="chip" data-act="rename">Change name</button><button class="chip" data-act="leave" ${busy ? "disabled" : ""}>Leave the leaderboard</button></div></div>`;
  }

  function rowHTML(r, rank, mine) {
    const badge = rank <= 3 ? img(MEDALS[rank - 1], "lb-medal") : `<span class="lb-rank">${fmt(rank)}</span>`;
    return `<li class="lb-row${mine ? " me" : ""}">${badge}<span class="lb-name">${esc(r.name)}${mine ? " <em>you</em>" : ""}</span><span class="lb-val">${value(board, r[board])}</span></li>`;
  }

  function render() {
    if (!box) return;
    const b = BOARDS.find((x) => x.field === board);
    const uid = account.user && account.user.uid;
    let list;
    if (error) list = `<p class="lb-msg">${esc(error)}</p>`;
    else if (loading && !rows.length) list = `<p class="lb-msg muted">Loading…</p>`;
    else if (!account.cloud) list = `<p class="lb-msg muted">The leaderboard isn't available right now.</p>`;
    else if (!rows.length) list = `<p class="lb-msg muted">No one is on the leaderboard yet. Be the first!</p>`;
    else {
      list = `<ol class="lb-list">${rows.map((r, i) => rowHTML(r, i + 1, r.uid === uid)).join("")}`;
      if (myEntry && myRank && myRank > rows.length) list += `<li class="lb-gap">…</li>${rowHTML({ ...myEntry }, myRank, true)}`;
      list += "</ol>";
    }
    box.innerHTML = `
      <div class="lb-head">
        <div class="seg lb-boards">${BOARDS.map((x) => `<button data-board="${x.field}" class="${x.field === board ? "active" : ""}">${img(x.icon, "lb-ico")}${x.label}</button>`).join("")}</div>
        <button class="chip" data-act="refresh" ${loading ? "disabled" : ""}>${loading ? "Loading…" : "Refresh"}</button>
      </div>
      <h3 class="lb-title">${b.long}</h3>
      ${meBox()}
      ${list}
      ${total ? `<p class="muted small lb-foot">${fmt(total)} ${total === 1 ? "player" : "players"} on the leaderboard. Scores are reported by each player's game.</p>` : ""}`;
    box.querySelectorAll("[data-board]").forEach((bt) => bt.addEventListener("click", () => { board = bt.dataset.board; load(true); }));
    box.querySelectorAll("[data-act]").forEach((el) => {
      const act = el.dataset.act;
      if (act === "join") el.addEventListener("submit", (e) => { e.preventDefault(); join(document.getElementById("lb-name").value.trim()); });
      else el.addEventListener("click", () => {
        if (act === "refresh") load(true);
        if (act === "signin") account.open();
        if (act === "rename") { editing = true; render(); }
        if (act === "cancel") { editing = false; error = ""; render(); }
        if (act === "leave") leave();
      });
    });
  }

  account.onUser(() => { editing = false; error = ""; loadMine(); });
  account.onSynced(() => maybeWrite(false));
  account.onCloud(() => { if (visible) load(true); });

  return {
    show() { visible = true; load(false); },
    hide() { visible = false; },
  };
}
