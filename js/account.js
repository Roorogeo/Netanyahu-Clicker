// Accounts & cloud sync. The save on this device is always the working copy, so the game
// keeps working (and saving) with no account, while offline, or if the server is down.
//
// Rules that keep progress from ever being lost:
//  - Signing up uploads this device's progress to the new account.
//  - If the account and this device disagree, the player chooses which to keep, and the
//    other one is backed up (on the device and/or in the cloud) before being replaced.
//  - Cloud writes only succeed if nobody else saved in the meantime (see cloud.js).
//  - Signing out keeps the progress on this device.
import { initCloud, cloudConfigured, friendlyError } from "./cloud.js";
import { safeGet, safeSet, safeRemove } from "./safety.js";

const META_KEY = "bibiClickerCloud.v1"; // { uid, rev }: which cloud revision this device's save came from
const SYNC_EVERY_MS = 90 * 1000;

export function initAccounts(h) {
  // h = { serialize, summary, loadSave, snapshot, toast, showModal, fmtBig, fmtTime, esc }
  const $ = (id) => document.getElementById(id);
  const panel = $("account"), body = $("account-body"), dot = $("acct-dot"), btn = $("btn-account");
  let cloud = null, user = null, status = cloudConfigured() ? "loading" : "off";
  let lastSynced = 0, pushing = false, conflictOpen = false, view = "signin", busy = false;
  const userListeners = [], syncListeners = [], cloudListeners = [];

  const readMeta = () => { try { return JSON.parse(safeGet(META_KEY) || "{}"); } catch (e) { return {}; } };
  const writeMeta = (uid, rev) => safeSet(META_KEY, JSON.stringify({ uid, rev }));
  const isBlank = (s) => (s.allTimeVotes || 0) < 100 && !(s.seats > 0) && !(s.elections > 0);

  function setStatus(s) {
    status = s;
    dot.dataset.status = s;
    const labels = {
      off: "Account (not set up)", loading: "Account", guest: "Sign in to save your progress to an account",
      syncing: "Saving to your account…", synced: "Saved to your account", offline: "Offline: saved on this device",
      conflict: "Your account needs attention",
    };
    btn.title = labels[s] || "Account";
    btn.setAttribute("aria-label", btn.title);
    const opt = $("acct-status-text");
    if (opt) opt.textContent = statusLine();
    if (!panel.classList.contains("hidden")) render();
  }
  function statusLine() {
    if (status === "off") return "Accounts aren't switched on for this copy of the game. Your progress is saved on this device.";
    if (!user) return "Not signed in. Your progress is saved on this device.";
    if (status === "conflict") return "This device and your account have different progress. Open your account to choose.";
    if (status === "offline") return "Can't reach the server right now. Your progress is safe on this device and will sync later.";
    if (status === "syncing") return "Saving to your account…";
    return lastSynced ? `Signed in as ${user.email || "you"}. Last saved to your account ${ago(lastSynced)}.` : `Signed in as ${user.email || "you"}.`;
  }
  const ago = (t) => {
    const s = Math.max(0, (Date.now() - t) / 1000);
    return s < 10 ? "just now" : `${h.fmtTime(s)} ago`;
  };
  const describe = (sum) => `<b>${h.fmtBig(sum.allTimeVotes || 0)}</b> votes all time · <b>${sum.seats || 0}</b> seats${sum.lastSave ? ` · saved ${ago(sum.lastSave)}` : ""}`;

  // ---------------- syncing ----------------
  async function push(expectedRev, quiet = true) {
    if (!cloud || !user || pushing || conflictOpen) return;
    pushing = true;
    if (!quiet) setStatus("syncing");
    try {
      const rev = await cloud.write(h.serialize(), h.summary(), expectedRev);
      writeMeta(user.uid, rev);
      lastSynced = Date.now();
      setStatus("synced");
      syncListeners.forEach((f) => f());
    } catch (e) {
      if (e.code === "conflict") { pushing = false; return askConflict(e.remote); }
      console.warn("Cloud save failed", e);
      setStatus("offline");
    } finally {
      pushing = false;
    }
  }
  function sync(quiet = true) {
    if (!user || status === "conflict" || status === "loading") return;
    const meta = readMeta();
    if (meta.uid !== user.uid) return reconcile();
    if (status === "offline") return reconcile();
    return push(meta.rev || 0, quiet);
  }

  // Decide what to do when someone signs in on this device
  async function reconcile() {
    if (!user) return;
    setStatus("syncing");
    let remote;
    try {
      remote = await cloud.load();
    } catch (e) {
      console.warn("Couldn't load cloud save", e);
      return setStatus("offline");
    }
    const meta = readMeta();
    const local = h.summary();
    if (!remote) {
      // New account: upload whatever is on this device
      await push(0);
      if (status === "synced") h.toast("Progress saved to your account", "You can now sign in on any device to keep playing.", "ballot", "gold");
      return;
    }
    if (meta.uid === user.uid && meta.rev === remote.rev) return push(remote.rev); // this device is ahead of (or equal to) the cloud
    if (isBlank(local)) {
      // Nothing to lose on this device: just load the account's progress
      adoptRemote(remote, "Before loading your account's progress");
      h.toast("Welcome back!", "Loaded your progress from your account.", "ballot", "gold");
      return;
    }
    askConflict(remote);
  }

  function adoptRemote(remote, reason) {
    h.snapshot(reason);
    h.loadSave(remote.save);
    writeMeta(user.uid, remote.rev);
    lastSynced = Date.now();
    setStatus("synced");
  }

  function askConflict(remote) {
    if (!remote) return push(0);
    conflictOpen = true;
    setStatus("conflict");
    const local = h.summary();
    const remoteAhead = (remote.summary.allTimeVotes || 0) >= (local.allTimeVotes || 0);
    const useAccount = {
      label: `Use my account's progress${remoteAhead ? " (more progress)" : ""}`, cls: remoteAhead ? "btn-primary" : "",
      onClick: () => {
        conflictOpen = false;
        adoptRemote(remote, "Before loading your account's progress");
        h.toast("Loaded your account's progress", "This device's previous progress was kept in Options → Backups.", "ballot", "gold");
      },
    };
    const keepDevice = {
      label: `Keep this device's progress${remoteAhead ? "" : " (more progress)"}`, cls: remoteAhead ? "" : "btn-primary",
      onClick: async () => {
        conflictOpen = false;
        try { await cloud.backup(remote.save, remote.summary, "Replaced by progress from another device"); } catch (e) { console.warn(e); }
        await push(remote.rev, false);
        h.toast("Saved this device's progress", "Your account's previous progress was kept as a cloud backup.", "ballot", "gold");
      },
    };
    h.showModal({
      icon: "scroll",
      title: "Which progress should we keep?",
      body: `<p>Your account and this device have different progress.</p>
        <div class="compare"><div><b>Your account</b><span>${describe({ ...remote.summary, lastSave: remote.updatedAt || remote.summary.lastSave })}</span></div>
        <div><b>This device</b><span>${describe(local)}</span></div></div>
        <p class="muted small">Nothing is deleted: whichever you don't pick is kept as a backup you can restore later.</p>`,
      dismissible: false,
      actions: remoteAhead ? [useAccount, keepDevice, later()] : [keepDevice, useAccount, later()],
    });
  }
  const later = () => ({ label: "Decide later", onClick: () => { conflictOpen = false; setStatus("conflict"); } });

  // ---------------- UI ----------------
  function open() { render(); panel.classList.remove("hidden"); requestAnimationFrame(() => panel.classList.add("open")); }
  function close() { panel.classList.remove("open"); panel.classList.add("hidden"); }

  function render() {
    if (status === "off") {
      body.innerHTML = `<p>Accounts aren't switched on for this copy of the game yet.</p>
        <p class="muted">Your progress is saved on this device and keeps working exactly as before. To move it to another device, use <b>Options → Export save</b>.</p>`;
      return;
    }
    if (!cloud) { body.innerHTML = `<p class="muted">Connecting…</p>`; return; }
    if (!user) return renderSignedOut();
    renderSignedIn();
  }

  function renderSignedOut() {
    const signup = view === "signup";
    body.innerHTML = `
      <p class="muted">Sign in to save your progress to an account and play on any device. Playing without an account still works; your progress stays on this device.</p>
      <div class="seg acct-tabs"><button data-v="signin" class="${signup ? "" : "active"}">Sign in</button><button data-v="signup" class="${signup ? "active" : ""}">Create account</button></div>
      <form class="acct-form" id="acct-form" novalidate>
        <label>Email<input type="email" id="acct-email" autocomplete="email" required></label>
        <label>Password<input type="password" id="acct-pass" autocomplete="${signup ? "new-password" : "current-password"}" minlength="6" required></label>
        ${signup ? `<p class="muted small">Your current progress on this device will be saved to the new account.</p>` : ""}
        <div class="acct-error" id="acct-error" role="alert"></div>
        <button class="btn btn-primary btn-big" type="submit" ${busy ? "disabled" : ""}>${signup ? "Create account" : "Sign in"}</button>
      </form>
      <div class="acct-or"><span>or</span></div>
      <button class="btn google-btn" id="acct-google" ${busy ? "disabled" : ""}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
        Continue with Google
      </button>
      ${signup ? "" : `<button class="linklike" id="acct-forgot">Forgot your password?</button>`}`;
    body.querySelectorAll(".acct-tabs button").forEach((b) => b.addEventListener("click", () => { view = b.dataset.v; render(); }));
    $("acct-form").addEventListener("submit", (e) => { e.preventDefault(); submit(); });
    $("acct-google").addEventListener("click", () => run(() => cloud.signInGoogle()));
    const f = $("acct-forgot");
    f && f.addEventListener("click", forgot);
  }

  function renderSignedIn() {
    body.innerHTML = `
      <div class="acct-user"><div class="acct-avatar">${h.esc((user.email || "?")[0].toUpperCase())}</div>
        <div><b>${h.esc(user.email || "Signed in")}</b><div class="acct-sync" data-status="${status}">${h.esc(status === "synced" && lastSynced ? `Saved to your account ${ago(lastSynced)}.` : statusLine())}</div></div></div>
      <div class="acct-actions">
        <button class="btn btn-primary" id="acct-sync-now">Save to my account now</button>
        <button class="btn" id="acct-backups">Account backups</button>
        ${status === "conflict" ? `<button class="btn" id="acct-resolve">Resolve: choose which progress to keep</button>` : ""}
        <button class="btn" id="acct-signout">Sign out</button>
      </div>
      <div id="acct-backup-list"></div>
      <p class="muted small">Your progress also stays saved on this device, so you can keep playing offline.</p>
      <button class="linklike danger" id="acct-delete">Delete my account</button>`;
    $("acct-sync-now").addEventListener("click", () => { h.snapshot("Before saving to your account", "auto"); sync(false); });
    $("acct-signout").addEventListener("click", signOutFlow);
    $("acct-backups").addEventListener("click", showCloudBackups);
    $("acct-delete").addEventListener("click", deleteFlow);
    const r = $("acct-resolve");
    r && r.addEventListener("click", () => { close(); reconcile(); });
  }

  async function run(fn) {
    if (busy) return;
    busy = true;
    const err = $("acct-error");
    if (err) err.textContent = "";
    body.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    try {
      await fn();
    } catch (e) {
      busy = false;
      render();
      const el = $("acct-error");
      if (el) el.textContent = friendlyError(e);
      else h.toast("Account", friendlyError(e), "scroll");
      return;
    }
    busy = false;
    render();
  }

  function submit() {
    const email = $("acct-email").value.trim(), pass = $("acct-pass").value;
    if (!email || !pass) { $("acct-error").textContent = "Please enter your email and a password."; return; }
    run(() => (view === "signup" ? cloud.signUp(email, pass) : cloud.signIn(email, pass)));
  }

  async function forgot() {
    const email = ($("acct-email").value || "").trim();
    if (!email) { $("acct-error").textContent = "Type your email above first, then tap \"Forgot your password?\" again."; return; }
    try {
      await cloud.resetPassword(email);
      $("acct-error").innerHTML = `<span class="ok">Check your inbox: we sent a password reset link to ${h.esc(email)}.</span>`;
    } catch (e) {
      $("acct-error").textContent = friendlyError(e);
    }
  }

  async function signOutFlow() {
    await sync(false); // one last save to the account first
    await cloud.signOut();
    h.toast("Signed out", "Your progress is still saved on this device.", "ballot");
  }

  async function showCloudBackups() {
    const box = $("acct-backup-list");
    box.innerHTML = `<p class="muted small">Loading backups…</p>`;
    let list = [];
    try { list = await cloud.listBackups(); } catch (e) { box.innerHTML = `<p class="acct-error">${h.esc(friendlyError(e))}</p>`; return; }
    if (!list.length) { box.innerHTML = `<p class="muted small">No account backups yet. One is made automatically whenever your account's progress is about to be replaced.</p>`; return; }
    box.innerHTML = `<div class="backup-list">${list.map((b) => `<div class="backup-row"><div><b>${h.esc(b.reason || "Backup")}</b><span>${describe({ ...b.summary, lastSave: b.t })}</span></div><button class="btn" data-id="${b.id}">Restore</button></div>`).join("")}</div>`;
    box.querySelectorAll("button[data-id]").forEach((bt) => bt.addEventListener("click", () => {
      const b = list.find((x) => x.id === bt.dataset.id);
      h.showModal({
        icon: "scroll", title: "Restore this account backup?",
        body: `<p>${describe({ ...b.summary, lastSave: b.t })}</p><p class="muted small">Your current progress is backed up first, so you can undo this.</p>`,
        actions: [
          { label: "Restore it", cls: "btn-primary", onClick: async () => {
            h.snapshot("Before restoring an account backup");
            try { await cloud.backup(h.serialize(), h.summary(), "Before restoring an account backup"); } catch (e) { console.warn(e); }
            h.loadSave(b.save);
            await sync(false);
            h.toast("Backup restored", "Your previous progress was backed up first.", "ballot", "gold");
          } },
          { label: "Cancel" },
        ],
      });
    }));
  }

  function deleteFlow() {
    h.showModal({
      icon: "scroll", title: "Delete your account?",
      body: `<p>This permanently deletes your account and the progress saved in it, including account backups.</p>
        <p><b>Your progress on this device is kept</b>, and you can keep playing without an account.</p>`,
      actions: [
        { label: "Delete my account", cls: "btn-danger", onClick: async () => {
          try {
            await cloud.deleteAccount();
            safeRemove(META_KEY);
            h.toast("Account deleted", "Your progress is still saved on this device.", "ballot");
          } catch (e) {
            h.toast("Couldn't delete the account", friendlyError(e), "scroll");
          }
        } },
        { label: "Keep my account", cls: "btn-primary" },
      ],
    });
  }

  // ---------------- wiring ----------------
  btn.addEventListener("click", open);
  $("account-close").addEventListener("click", close);
  panel.addEventListener("click", (e) => { if (e.target === panel) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.classList.contains("hidden")) close(); });
  const optBtn = $("btn-open-account");
  optBtn && optBtn.addEventListener("click", open);
  setStatus(status);

  if (cloudConfigured()) {
    initCloud({
      onUser: (u) => {
        const was = user;
        user = u;
        userListeners.forEach((f) => f(u));
        if (!u) { if (was) setStatus("guest"); else setStatus("guest"); return; }
        if (!panel.classList.contains("hidden")) close();
        reconcile();
      },
    }).then((c) => {
      cloud = c;
      cloudListeners.forEach((f) => f(c));
      if (!user) setStatus("guest");
      render();
    }).catch((e) => {
      console.warn("Cloud unavailable", e);
      setStatus("offline");
    });
    setInterval(() => sync(true), SYNC_EVERY_MS);
    document.addEventListener("visibilitychange", () => { if (document.hidden) sync(true); });
  }

  return {
    // called after big moments (upgrade, election, tree) to save to the account sooner
    soon() { clearTimeout(this._t); this._t = setTimeout(() => sync(true), 4000); },
    get signedIn() { return !!user; },
    get cloud() { return cloud; },
    get user() { return user; },
    onUser(f) { userListeners.push(f); },
    onSynced(f) { syncListeners.push(f); },
    onCloud(f) { if (cloud) f(cloud); else cloudListeners.push(f); },
    open,
  };
}
