/**
 * HEISTY SPIDEYS — The Alert
 * --------------------------
 * The Alert is a single shared number that tracks how awake the location is.
 * It lives in a world-scoped setting so every client sees the same value, and
 * is surfaced through a frameless, always-visible HUD meter (an ApplicationV2).
 * Only the Storyteller (GM) can move it.
 */

import { HEISTY } from "../config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

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

  /** Set the Alert to an absolute value (GM only). */
  async set(v) {
    if (!game.user.isGM) return;
    const val = Math.max(0, Math.round(Number(v) || 0));
    await game.settings.set(HEISTY.id, "alert", val);
    this._announce(val);
  },

  /** Nudge the Alert by a delta (GM only). */
  async applyDelta(d) {
    if (!game.user.isGM) return;
    await this.set(this.value + Number(d));
  },

  /** Set the Alert Limit (the location's difficulty) (GM only). */
  async setLimit(v) {
    if (!game.user.isGM) return;
    await game.settings.set(HEISTY.id, "alertLimit", Math.max(1, Math.round(Number(v) || 8)));
  },

  /** Whisper a short threshold note to the table when a band boundary is crossed. */
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

/** The always-visible Alert meter HUD. */
export class AlertMeter extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "heisty-alert-meter",
    classes: ["heisty-spideys", "heisty-alert-meter"],
    tag: "section",
    window: { frame: false, positioned: true },
    position: { width: 260, height: "auto", top: 96, left: 78 },
    actions: {
      bump: AlertMeter.#onBump,
      reset: AlertMeter.#onReset,
      toggle: AlertMeter.#onToggle
    }
  };

  static PARTS = {
    main: { template: "systems/heisty-spideys/templates/hud/alert-meter.hbs" }
  };

  /** Collapsed state persists for the session only. */
  #collapsed = false;

  async _prepareContext() {
    const value = HeistyAlert.value;
    const limit = HeistyAlert.limit;
    const state = HEISTY.getAlertState(value, limit);
    const pct = Math.min(100, Math.round((value / Math.max(1, limit)) * 100));
    return {
      value, limit, state, pct,
      collapsed: this.#collapsed,
      isGM: game.user.isGM,
      limits: HEISTY.alertLimits,
      atLimit: state.atLimit
    };
  }

  /** Render only when the client wants the meter and the user is in a world. */
  render(...args) {
    let show = true;
    try { show = game.settings.get(HEISTY.id, "showAlertMeter"); } catch (e) { /* not ready */ }
    if (!show) {
      if (this.rendered) this.close();
      return this;
    }
    return super.render(...args);
  }

  _onRender(context, options) {
    const root = this.element;
    if (!root) return;

    // Wire the Limit <select> (GM only).
    const sel = root.querySelector("select[name='alertLimit']");
    if (sel) {
      sel.addEventListener("change", async ev => {
        await HeistyAlert.setLimit(Number(ev.currentTarget.value));
      });
    }

    // Wire the exact-value number input (GM only).
    const num = root.querySelector("input[name='alertValue']");
    if (num) {
      num.addEventListener("change", async ev => {
        await HeistyAlert.set(Number(ev.currentTarget.value));
      });
    }

    // Make the meter draggable by its grip.
    const grip = root.querySelector(".heisty-alert-grip");
    if (grip) this.#enableDrag(grip);
  }

  /** Apply the saved position the first time the meter is shown. */
  _onFirstRender(context, options) {
    super._onFirstRender?.(context, options);
    let saved = null;
    try { saved = game.settings.get(HEISTY.id, "alertMeterPosition"); } catch (e) { /* not ready */ }
    if (saved && Number.isFinite(saved.top) && Number.isFinite(saved.left)) {
      this.setPosition({ top: saved.top, left: saved.left });
    }
  }

  #savePosition() {
    const { top, left } = this.position;
    if (!Number.isFinite(top) || !Number.isFinite(left)) return;
    game.settings.set(HEISTY.id, "alertMeterPosition", { top, left }).catch(() => {});
  }

  #enableDrag(handle) {
    handle.style.cursor = "grab";
    handle.addEventListener("pointerdown", ev => {
      // Left button only, and never start a drag from a control (toggle, buttons…).
      if (ev.button !== 0 || ev.target.closest("button, a, input, select")) return;
      ev.preventDefault();
      const start = {
        x: ev.clientX, y: ev.clientY,
        top: this.position.top ?? 0, left: this.position.left ?? 0
      };
      const onMove = e => this.setPosition({
        left: start.left + (e.clientX - start.x),
        top: start.top + (e.clientY - start.y)
      });
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        this.#savePosition();
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    });
  }

  static async #onBump(event, target) {
    await HeistyAlert.applyDelta(Number(target.dataset.delta ?? 1));
  }

  static async #onReset() {
    if (!game.user.isGM) return;
    await HeistyAlert.set(0);
  }

  static #onToggle() {
    this.#collapsed = !this.#collapsed;
    this.render();
  }
}
