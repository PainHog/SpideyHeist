/**
 * HEISTY SPIDEYS — The Alert
 * --------------------------
 * The Alert is a single shared number tracking how awake the location is.
 * Since 1.8.0 it is a pure fold over the Alert ledger (logic/alert-ledger.mjs)
 * kept in the heist state: every change is an entry keyed by an eventId, one
 * event raises it once by its largest trigger, and reactions are exact,
 * reversible amendments. The world setting `alert` mirrors the folded value so
 * every client (and the HUD) reads it as before.
 *
 * The old API is kept: `value`, `limit`, `state`, `set(v, {force})`,
 * `applyDelta(d)`, `setLimit(v)` — `set` and `applyDelta` become `manual`
 * ledger entries. New: `raise`, `amend`, `confirm`, `refold`.
 *
 * Full Alert (rulebook v4.8): once the Alert reaches the Limit it stays there
 * for the rest of the heist — nothing raises or lowers it — and whatever the
 * Limit, it brings the Lockdown penalties. An amendment that re-folds below
 * the Limit asks the GM to confirm ("This undoes Full Alert"); Reset (a new
 * heist) or a new, higher Limit releases it.
 *
 * The HUD is a plain fixed-position DOM element (reliable, framework-free drag).
 * It gains a pending strip (autoAlert = confirm) and a New Scene button in
 * freeplay.
 */

import { HEISTY } from "../config.mjs";
import { SYSTEM_ID, SETTINGS, HOOKS } from "../contracts.mjs";
import {
  foldLedger, upsertEvent, amendEvent, setEntry, compact, previewAmend, confirmEvent,
  proposedEntries, describeEntry, findEvent, hasEvent
} from "../logic/alert-ledger.mjs";
import * as flow from "../logic/heist-flow.mjs";
import { store } from "../heist/store.mjs";
import { gm, isActiveGM } from "../net/gm-ops.mjs";

const renderTemplate = (path, data) => foundry.applications.handlebars.renderTemplate(path, data);

function setting(key, fallback) {
  try {
    if (game.settings?.settings?.has && !game.settings.settings.has(`${SYSTEM_ID}.${key}`)) return fallback;
    return game.settings.get(SYSTEM_ID, key) ?? fallback;
  } catch (e) { return fallback; }
}

/** Read/write helper around the Alert (ledger + mirrored world settings). */
export const HeistyAlert = {
  get value() {
    try { return game.settings.get(HEISTY.id, "alert"); } catch (e) { return 0; }
  },
  get limit() {
    try { return game.settings.get(HEISTY.id, "alertLimit"); } catch (e) { return 8; }
  },
  get state() {
    return HEISTY.getAlertState(this.value, this.limit);
  },
  /** The ledger entries (heist state). */
  get ledger() {
    return store.state.alertLedger ?? [];
  },
  /** The fold of the ledger right now. */
  fold() {
    return foldLedger(this.ledger, this.limit);
  },
  get locked() {
    return this.value >= this.limit;
  },
  /** "auto" | "confirm" | "manual". */
  mode() {
    return setting(SETTINGS.autoAlert, "auto");
  },

  /**
   * Raise (or update) an event. Active GM writes; a player's call goes through
   * the internal `heist.alertRaise` op (ability events only).
   * @param {object} e
   * @param {string} e.eventId
   * @param {{key, delta, label}[]} [e.triggers]
   * @param {{key}[]} [e.cancels]
   * @param {string} [e.cause]          roll | group | creature | spike | out | complication | flaw | ability | manual
   * @param {object} [e.source]         {messageId, actorId}
   * @param {object} [e.group]          {id, closed, allCritical}
   * @param {string} [e.replaceMessage] replace what this card contributed before
   * @param {boolean} [e.proposed]      confirm mode: wait for the GM's ✓
   */
  async raise(e = {}) {
    if (!e?.eventId) throw new Error("alert.raise: an eventId is required");
    if (!game.user.isGM) return gm.run("heist.alertRaise", { ...e, userId: game.user.id }, { quiet: true }).catch(() => null);
    if (!isActiveGM()) return null;
    const c = store.clock();
    const isNew = !hasEvent(this.ledger, e.eventId);
    const proposed = e.proposed ?? (isNew && this.mode() === "confirm" && e.cause !== "manual");
    const patch = {
      triggers: e.triggers, cancels: e.cancels, reductions: e.reductions, group: e.group,
      replaceSource: e.replaceSource, replaceMessage: e.replaceMessage, removeTriggers: e.removeTriggers,
      cause: e.cause, source: e.source, label: e.label,
      ...(isNew ? { roundSerial: e.roundSerial ?? c.roundSerial, obstacleSerial: c.obstacleSerial, heistId: c.heistId, round: c.round } : {}),
      ...(isNew && proposed ? { proposed: true } : {})
    };
    if (!isNew && hasEvent(this.ledger, e.eventId) && !findEvent(this.ledger, e.eventId)) return null; // compacted already
    await store.mutate(s => ({ ...s, alertLedger: upsertEvent(s.alertLedger ?? [], e.eventId, patch) }), { label: `alert ${e.eventId}` });
    return this.refold({ eventId: e.eventId });
  },

  /**
   * Amend an event (a cancel, a reduction, a re-trigger). If that would undo
   * Full Alert, the GM confirms first.
   */
  async amend(eventId, patch = {}, { confirmUnlock = true } = {}) {
    if (!isActiveGM()) return null;
    const p = previewAmend(this.ledger, eventId, patch, this.limit);
    if (p.unlocks && confirmUnlock) {
      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: "Undo Full Alert?" },
        content: `<p>This undoes Full Alert: the Alert falls back to <strong>${p.after.value}</strong>. Whatever woke up stays awake.</p>`,
        rejectClose: false
      }).catch(() => false);
      if (!ok) return null;
    }
    await store.mutate(s => ({ ...s, alertLedger: amendEvent(s.alertLedger ?? [], eventId, patch) }), { label: `amend ${eventId}` });
    const f = await this.refold({ eventId });
    if (p.unlocks && !f.locked) await store.mutate(s => flow.undoFullAlert(s), { label: "undo Full Alert" });
    return f;
  },

  /** Confirm mode: accept or reject a proposed entry. */
  async confirm(eventId, accept = true) {
    if (!isActiveGM()) return null;
    await store.mutate(s => ({ ...s, alertLedger: confirmEvent(s.alertLedger ?? [], eventId, accept) }), { label: "confirm" });
    return this.refold({ eventId });
  },

  /**
   * Set the Alert (a manual `set` entry). Clamped to 0…Limit and locked at
   * Full Alert; `force` is the GM's Reset for a new heist (it releases Full Alert).
   */
  async set(v, { force = false } = {}) {
    if (!game.user.isGM) return;
    if (!isActiveGM()) { ui.notifications?.info("Only the active Storyteller changes the Alert."); return; }
    const want = Math.max(0, Math.round(Number(v) || 0));
    if (!force && this.locked && want < this.limit) {
      ui.notifications?.info("Full Alert: the Alert is locked at the Limit for the rest of the heist. Use Reset for a new heist.");
    }
    await store.mutate(s => {
      const ledger = force ? setEntry([], want, { force: true, cause: "reset" }) : setEntry(s.alertLedger ?? [], want, { cause: "manual" });
      const next = { ...s, alertLedger: ledger };
      return force ? flow.undoFullAlert(next) : next;
    }, { label: "alert set" });
    await this.refold();
  },

  /** A manual bump (the HUD's ±buttons, manual-mode card buttons). */
  async applyDelta(d) {
    if (!game.user.isGM) return;
    const delta = Math.round(Number(d) || 0);
    if (!delta) return;
    const id = `manual:${foundry.utils.randomID()}`;
    await this.raise({ eventId: id, triggers: [{ key: "manual", delta, label: "Storyteller", src: "gm" }], cause: "manual", proposed: false });
  },

  /** A new Limit. The ledger is compacted first, so a higher Limit releases Full Alert at the current value. */
  async setLimit(v) {
    if (!game.user.isGM || !isActiveGM()) return;
    const lim = Math.max(1, Math.round(Number(v) || 8));
    const old = this.limit;
    await store.mutate(s => ({ ...s, limit: lim, alertLedger: compact(s.alertLedger ?? [], old) }), { label: "limit" });
    await game.settings.set(HEISTY.id, "alertLimit", lim);
    await this.refold();
  },

  /**
   * Fold the ledger and mirror the value into the `alert` setting. When it
   * changes, announces the band and fires HOOKS.alertChanged(value, entry, info)
   * (the GM's automation runs creature escalation off it).
   */
  async refold({ eventId = null } = {}) {
    if (!isActiveGM()) return this.fold();
    const before = this.value;
    const f = this.fold();
    if (f.value !== before) {
      await game.settings.set(HEISTY.id, "alert", f.value);
      this._announce(f.value);
      const entry = eventId ? findEvent(this.ledger, eventId) : null;
      Hooks.callAll(HOOKS.alertChanged, f.value, entry, { prev: before, locked: f.locked, limit: this.limit, fold: f });
    } else {
      ui.heistyAlert?.render();
    }
    return f;
  },

  _announce(val) {
    const state = HEISTY.getAlertState(val, this.limit);
    if (state.key === this._lastBand) return;
    this._lastBand = state.key;
    const flavor = `<div class="heisty-alert-flash heisty-band-${state.key}">`
      + `<span class="heisty-alert-flash-label">Alert ${val} &middot; ${state.label}</span>`
      + `<span class="heisty-alert-flash-desc">${state.description}</span></div>`;
    ChatMessage.create({
      content: flavor,
      speaker: { alias: "The Alert" },
      style: CONST.CHAT_MESSAGE_STYLES.OOC
    });
  }
};

/** Register the Alert-related settings during `init`. */
export function registerAlertSettings() {
  game.settings.register(HEISTY.id, "alert", {
    name: "Current Alert",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    onChange: () => ui.heistyAlert?.render()
  });
  game.settings.register(HEISTY.id, "alertLimit", {
    name: "Alert Limit",
    scope: "world",
    config: false,
    type: Number,
    default: 8,
    onChange: () => ui.heistyAlert?.render()
  });
  game.settings.register(HEISTY.id, "showAlertMeter", {
    name: "HEISTY.Settings.ShowAlertMeter.Name",
    hint: "HEISTY.Settings.ShowAlertMeter.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => ui.heistyAlert?.render()
  });
  game.settings.register(HEISTY.id, "alertMeterPosition", {
    scope: "client",
    config: false,
    type: Object,
    default: null
  });
}

/** The always-visible, draggable Alert meter HUD (a plain fixed DOM element). */
export class AlertMeter {
  constructor() {
    this.collapsed = false;
    this.el = null;
  }

  get shown() {
    try { return game.settings.get(HEISTY.id, "showAlertMeter"); } catch (e) { return true; }
  }

  /** Build or refresh the HUD. */
  async render() {
    if (!this.shown) { this.close(); return; }

    if (!this.el) {
      this.el = document.createElement("section");
      this.el.id = "heisty-alert-meter";
      this.el.className = "heisty-spideys themed theme-light"; // the parchment art is light-only
      document.body.appendChild(this.el);
      this.#applySavedPosition();
    }

    const value = HeistyAlert.value;
    const limit = HeistyAlert.limit;
    const state = HEISTY.getAlertState(value, limit);
    const pct = Math.min(100, Math.round((value / Math.max(1, limit)) * 100));
    const isGM = game.user.isGM;
    let hs = null;
    try { hs = store.state; } catch (e) { hs = null; }
    const pending = isGM ? proposedEntries(hs?.alertLedger ?? []).map(e => ({ eventId: e.eventId, text: describeEntry(e) })) : [];
    const phase = hs?.phase ?? "idle";

    this.el.innerHTML = await renderTemplate("systems/heisty-spideys/templates/hud/alert-meter.hbs", {
      value, limit, state, pct,
      collapsed: this.collapsed,
      isGM,
      limits: HEISTY.alertLimits,
      atLimit: state.atLimit,
      pending,
      hasPending: pending.length > 0,
      freeplay: phase === "idle",
      phaseLabel: phase === "idle" ? "" : phase.charAt(0).toUpperCase() + phase.slice(1),
      heistName: hs?.name ?? "",
      round: hs?.round ?? 0,
      inPlay: phase === "heist" || phase === "escape"
    });

    this.#wire();
  }

  close() {
    this.el?.remove();
    this.el = null;
  }

  #applySavedPosition() {
    let pos = null;
    try { pos = game.settings.get(HEISTY.id, "alertMeterPosition"); } catch (e) { /* not ready */ }
    if (pos && Number.isFinite(pos.top) && Number.isFinite(pos.left)) {
      this.el.style.top = `${this.#clampTop(pos.top)}px`;
      this.el.style.left = `${this.#clampLeft(pos.left)}px`;
    } else {
      // Default: tucked top-left of the board, clear of the scene controls.
      this.el.style.top = "96px";
      this.el.style.left = "78px";
    }
  }

  #clampLeft(x) { return Math.max(0, Math.min(window.innerWidth - 60, x)); }
  #clampTop(y) { return Math.max(0, Math.min(window.innerHeight - 24, y)); }

  #wire() {
    const root = this.el;

    root.querySelectorAll("[data-action]").forEach(btn => {
      const action = btn.dataset.action;
      btn.addEventListener("click", async ev => {
        ev.preventDefault();
        if (action === "toggle") { this.collapsed = !this.collapsed; this.render(); }
        else if (action === "bump") await HeistyAlert.applyDelta(Number(btn.dataset.delta ?? 1));
        else if (action === "reset") { if (game.user.isGM) await HeistyAlert.set(0, { force: true }); }
        else if (action === "confirm") await HeistyAlert.confirm(btn.dataset.eventId, true);
        else if (action === "reject") await HeistyAlert.confirm(btn.dataset.eventId, false);
        else if (action === "newScene") await game.heistySpideys?.heist?.newScene?.();
        else if (action === "endRound") await game.heistySpideys?.heist?.endRound?.();
        else if (action === "tracker") game.heistySpideys?.heist?.openTracker?.();
      });
    });

    const sel = root.querySelector("select[name='alertLimit']");
    if (sel) sel.addEventListener("change", ev => HeistyAlert.setLimit(Number(ev.currentTarget.value)));

    const num = root.querySelector("input[name='alertValue']");
    if (num) num.addEventListener("change", ev => HeistyAlert.set(Number(ev.currentTarget.value)));

    const grip = root.querySelector(".heisty-alert-grip");
    if (grip) this.#enableDrag(grip);
  }

  #enableDrag(handle) {
    handle.style.cursor = "grab";
    handle.addEventListener("pointerdown", ev => {
      // Left button only; never start a drag from a control.
      if (ev.button !== 0 || ev.target.closest("button, a, input, select")) return;
      ev.preventDefault();
      const rect = this.el.getBoundingClientRect();
      const offset = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      handle.style.cursor = "grabbing";

      const onMove = e => {
        this.el.style.left = `${this.#clampLeft(e.clientX - offset.x)}px`;
        this.el.style.top = `${this.#clampTop(e.clientY - offset.y)}px`;
      };
      const onUp = () => {
        handle.style.cursor = "grab";
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        const r = this.el.getBoundingClientRect();
        game.settings.set(HEISTY.id, "alertMeterPosition", { top: r.top, left: r.left }).catch(() => {});
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    });
  }
}
