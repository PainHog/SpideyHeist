/**
 * HEISTY SPIDEYS — The Alert
 * --------------------------
 * The Alert is a single shared number tracking how awake the location is. It
 * lives in a world-scoped setting so every client sees the same value. It is
 * surfaced through a small, always-draggable HUD that every viewer can place
 * wherever they like (position is remembered per client). Only the GM can
 * change the value.
 *
 * The HUD is a plain fixed-position DOM element we manage directly, rather than
 * an ApplicationV2 window — that gives us reliable, framework-independent drag
 * and placement.
 */

import { HEISTY } from "../config.mjs";

const renderTemplate = (path, data) => foundry.applications.handlebars.renderTemplate(path, data);

/** Read/write helper around the Alert world settings. */
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

  async set(v) {
    if (!game.user.isGM) return;
    const val = Math.max(0, Math.round(Number(v) || 0));
    await game.settings.set(HEISTY.id, "alert", val);
    this._announce(val);
  },

  async applyDelta(d) {
    if (!game.user.isGM) return;
    await this.set(this.value + Number(d));
  },

  async setLimit(v) {
    if (!game.user.isGM) return;
    await game.settings.set(HEISTY.id, "alertLimit", Math.max(1, Math.round(Number(v) || 8)));
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
      this.el.className = "heisty-spideys";
      document.body.appendChild(this.el);
      this.#applySavedPosition();
    }

    const value = HeistyAlert.value;
    const limit = HeistyAlert.limit;
    const state = HEISTY.getAlertState(value, limit);
    const pct = Math.min(100, Math.round((value / Math.max(1, limit)) * 100));

    this.el.innerHTML = await renderTemplate("systems/heisty-spideys/templates/hud/alert-meter.hbs", {
      value, limit, state, pct,
      collapsed: this.collapsed,
      isGM: game.user.isGM,
      limits: HEISTY.alertLimits,
      atLimit: state.atLimit
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
        else if (action === "reset") { if (game.user.isGM) await HeistyAlert.set(0); }
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
