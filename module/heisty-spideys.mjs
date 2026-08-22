/**
 * HEISTY SPIDEYS
 * A tabletop roleplaying game of eight-legged larceny.
 * Foundry VTT game system — entry point.
 */

import { HEISTY } from "./config.mjs";
import { SpiderData, ThreatData } from "./data/actor-data.mjs";
import { SpeciesData, RoleData, PerkData, FlawData, GadgetData } from "./data/item-data.mjs";
import { HeistyActor } from "./documents/actor.mjs";
import { HeistyItem } from "./documents/item.mjs";
import { SpiderSheet } from "./sheets/spider-sheet.mjs";
import { ThreatSheet } from "./sheets/threat-sheet.mjs";
import { HeistyItemSheet } from "./sheets/item-sheet.mjs";
import { HeistyDice } from "./helpers/dice.mjs";
import { HeistyAlert, AlertMeter, registerAlertSettings } from "./helpers/alert.mjs";
import { CharacterBuilder } from "./apps/character-builder.mjs";
import { importContent, autoImportContent } from "./helpers/content.mjs";
import { registerSocket } from "./helpers/socket.mjs";

/* -------------------------------------------- */
/*  Init                                        */
/* -------------------------------------------- */

Hooks.once("init", function () {
  console.log("Heisty Spideys | Booting up the crew.");

  // Public API
  game.heistySpideys = {
    HEISTY,
    dice: HeistyDice,
    alert: HeistyAlert,
    CharacterBuilder,
    openBuilder: () => {
      try {
        return Promise.resolve(new CharacterBuilder().render(true)).catch(err => {
          console.error("Heisty Spideys | Character Builder failed to render:", err);
          ui.notifications?.error("The Character Builder hit an error — press F12 and check the console.");
        });
      } catch (err) {
        console.error("Heisty Spideys | Character Builder failed to open:", err);
        ui.notifications?.error("The Character Builder failed to open — press F12 and check the console.");
      }
    },
    importContent
  };
  CONFIG.HEISTY = HEISTY;

  // Document classes
  CONFIG.Actor.documentClass = HeistyActor;
  CONFIG.Item.documentClass = HeistyItem;

  // Data models
  Object.assign(CONFIG.Actor.dataModels, { spider: SpiderData, threat: ThreatData });
  Object.assign(CONFIG.Item.dataModels, {
    species: SpeciesData, role: RoleData, perk: PerkData, flaw: FlawData, gadget: GadgetData
  });

  // Combat initiative (crew acts first, then threats — a simple default formula)
  CONFIG.Combat.initiative = { formula: "1d6", decimals: 0 };

  // Sheets
  const DSC = foundry.applications.apps.DocumentSheetConfig;
  DSC.registerSheet(Actor, HEISTY.id, SpiderSheet, {
    types: ["spider"], makeDefault: true, label: "HEISTY.SheetLabel.Spider"
  });
  DSC.registerSheet(Actor, HEISTY.id, ThreatSheet, {
    types: ["threat"], makeDefault: true, label: "HEISTY.SheetLabel.Threat"
  });
  DSC.registerSheet(Item, HEISTY.id, HeistyItemSheet, {
    types: ["species", "role", "perk", "flaw", "gadget"], makeDefault: true, label: "HEISTY.SheetLabel.Item"
  });

  // Settings
  registerAlertSettings();
  game.settings.register(HEISTY.id, "systemMigrationVersion", {
    scope: "world", config: false, type: String, default: ""
  });
  game.settings.register(HEISTY.id, "contentImported", {
    scope: "world", config: false, type: Boolean, default: false
  });

  registerHandlebarsHelpers();
  HeistyDice.registerChatListeners();
});

/* -------------------------------------------- */
/*  Ready                                       */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // Player character-creation proxy (players lack ACTOR_CREATE by default).
  registerSocket();

  // Populate empty compendiums from bundled source, if needed (GM only, once).
  await autoImportContent();

  // Raise the Alert meter HUD.
  ui.heistyAlert = new AlertMeter();
  ui.heistyAlert.render();

  // One-time migration bookkeeping.
  if (game.user.isGM) {
    const current = game.system.version;
    const last = game.settings.get(HEISTY.id, "systemMigrationVersion");
    if (!last) await game.settings.set(HEISTY.id, "systemMigrationVersion", current);
  }

  console.log("Heisty Spideys | The crew is in position.");
});

/* -------------------------------------------- */
/*  Character Builder launch button             */
/* -------------------------------------------- */

Hooks.on("renderActorDirectory", (app, html) => {
  // Shown to everyone: players who lack ACTOR_CREATE are handled by the GM
  // socket proxy when they finish the builder.
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector(".heisty-build-spider")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "heisty-build-spider";
  btn.innerHTML = `<i class="fa-solid fa-spider"></i> Build a Spider`;
  btn.addEventListener("click", () => game.heistySpideys.openBuilder());

  const header = root.querySelector(".directory-header .header-actions")
    ?? root.querySelector(".directory-header")
    ?? root.querySelector(".header-actions");
  if (header) header.appendChild(btn);
  else root.prepend(btn);
});

/* -------------------------------------------- */
/*  Handlebars helpers                          */
/* -------------------------------------------- */

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("heEq", (a, b) => a === b);
  Handlebars.registerHelper("heNeq", (a, b) => a !== b);
  Handlebars.registerHelper("heGt", (a, b) => Number(a) > Number(b));
  Handlebars.registerHelper("heGte", (a, b) => Number(a) >= Number(b));
  Handlebars.registerHelper("heLt", (a, b) => Number(a) < Number(b));
  Handlebars.registerHelper("heAdd", (a, b) => Number(a) + Number(b));
  Handlebars.registerHelper("heSub", (a, b) => Number(a) - Number(b));
  Handlebars.registerHelper("heAbs", (a) => Math.abs(Number(a) || 0));
  Handlebars.registerHelper("heSigned", (a) => {
    const n = Number(a) || 0;
    return n > 0 ? `+${n}` : `${n}`;
  });
  Handlebars.registerHelper("heRepeat", (n) => Array.from({ length: Math.max(0, Number(n) || 0) }, (_, i) => i));
  Handlebars.registerHelper("heIncludes", (arr, val) => Array.isArray(arr) && arr.includes(val));
  Handlebars.registerHelper("heCap", (s) => {
    s = String(s ?? "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
  Handlebars.registerHelper("hePct", (a, b) => {
    const max = Math.max(1, Number(b) || 1);
    return Math.min(100, Math.round((Number(a) || 0) / max * 100));
  });
}
