/**
 * HEISTY SPIDEYS — Automation settings (design §9)
 * ------------------------------------------------
 * Registered at init by registerHeistAutomation(). Setting names and hints are
 * lang keys (HEISTY.Settings.<Key>.Name / .Hint, added to lang/en.json by the
 * integrator); choice labels are literal English like the rest of the UI.
 * With every auto* setting off the system behaves like 1.7.0, plus the tracker
 * as a checklist.
 */

import { SYSTEM_ID, SETTINGS } from "../contracts.mjs";

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const name = key => `HEISTY.Settings.${cap(key)}.Name`;
const hint = key => `HEISTY.Settings.${cap(key)}.Hint`;

/** The lang keys this package needs (for the integrator and the contracts test). */
export const SETTING_LANG_KEYS = Object.freeze(
  Object.values(SETTINGS).filter(k => k !== SETTINGS.heistState && k !== SETTINGS.trackerPosition).flatMap(k => [name(k), hint(k)])
);

/** Read a setting with a fallback (unregistered, or not ready yet). */
export function setting(key, fallback = null) {
  try {
    if (game.settings?.settings?.has && !game.settings.settings.has(`${SYSTEM_ID}.${key}`)) return fallback;
    const v = game.settings.get(SYSTEM_ID, key);
    return v === undefined || v === null ? fallback : v;
  } catch (err) {
    return fallback;
  }
}

/**
 * Register every §9 setting.
 * @param {{onStateChange?:Function, onTrackerChange?:Function}} [handlers]
 */
export function registerHeistSettings({ onStateChange = null, onTrackerChange = null } = {}) {
  const reg = (key, data) => {
    if (game.settings.settings?.has?.(`${SYSTEM_ID}.${key}`)) return;
    game.settings.register(SYSTEM_ID, key, data);
  };
  const world = (key, type, def, extra = {}) => reg(key, {
    name: name(key), hint: hint(key), scope: "world", config: true, type, default: def, ...extra
  });

  reg(SETTINGS.heistState, {
    scope: "world", config: false, type: Object, default: null,
    onChange: v => onStateChange?.(v)
  });

  world(SETTINGS.autoAlert, String, "auto", { choices: { auto: "Automatic", confirm: "Propose — the Storyteller confirms each change", manual: "Manual (buttons on cards)" } });
  world(SETTINGS.autoSilk, Boolean, true);
  world(SETTINGS.autoHits, String, "prompt", { choices: { prompt: "Ask the Storyteller", auto: "Automatic", off: "Off" } });
  world(SETTINGS.autoVitality, Boolean, true);
  world(SETTINGS.autoCreatures, Boolean, true);
  world(SETTINGS.autoClock, Boolean, true);
  world(SETTINGS.autoStall, Boolean, true);
  world(SETTINGS.autoRecovery, Boolean, true);
  world(SETTINGS.autoWaitingWeb, String, "auto", { choices: { auto: "Automatic", prompt: "Ask the Storyteller first", off: "Off" } });
  world(SETTINGS.autoCapture, Boolean, true);
  world(SETTINGS.autoFlaws, Boolean, true);
  world(SETTINGS.autoProcedures, Boolean, true);
  world(SETTINGS.autoEndRound, String, "prompt", { choices: { prompt: "Prompt the Storyteller", auto: "Automatic", off: "Off" } });
  world(SETTINGS.forcedRolls, String, "player", { choices: { player: "The player rolls", auto: "Rolled automatically" } });
  world(SETTINGS.trackerForPlayers, Boolean, true, { onChange: () => onTrackerChange?.() });
  world(SETTINGS.movementWarnings, Boolean, false);
  reg(SETTINGS.trackerPosition, { scope: "client", config: false, type: Object, default: null });
}
