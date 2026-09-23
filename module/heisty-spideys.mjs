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
import { registerSocket } from "./helpers/socket.mjs";
import { migrateWorld } from "./helpers/migration.mjs";

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
        // Reuse the open builder (fixed id) so a second click never discards a build in progress.
        const app = foundry.applications.instances.get(CharacterBuilder.DEFAULT_OPTIONS.id) ?? new CharacterBuilder();
        return Promise.resolve(app.render({ force: true })).catch(err => {
          console.error("Heisty Spideys | Character Builder failed to render:", err);
          ui.notifications?.error("The Character Builder hit an error — press F12 and check the console.");
        });
      } catch (err) {
        console.error("Heisty Spideys | Character Builder failed to open:", err);
        ui.notifications?.error("The Character Builder failed to open — press F12 and check the console.");
      }
    }
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

  registerHandlebarsHelpers();
  HeistyDice.registerChatListeners();
});

/* -------------------------------------------- */
/*  Ready                                       */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // Player character-creation proxy (players lack ACTOR_CREATE by default).
  registerSocket();

  // Raise the Alert meter HUD.
  ui.heistyAlert = new AlertMeter();
  ui.heistyAlert.render();

  // Version-keyed, GM-only, idempotent world migration.
  await migrateWorld();

  console.log("Heisty Spideys | The crew is in position.");
});

/* -------------------------------------------- */
/*  Character Builder launch button             */
/* -------------------------------------------- */

// Launcher #1: a "Build a Spider" button at the BOTTOM of the Actors directory
// (its footer) — never injected into the sidebar header, which breaks v13's
// flex layout. Shown to everyone; players who lack ACTOR_CREATE are handled by
// the GM socket proxy when they finish the builder.
Hooks.on("renderActorDirectory", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector(".heisty-build-spider")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "heisty-build-spider";
  btn.innerHTML = `<i class="fa-solid fa-spider"></i> Build a Spider`;
  btn.addEventListener("click", () => game.heistySpideys.openBuilder());

  const footer = root.querySelector('[data-application-part="footer"]')
    ?? root.querySelector(".directory-footer")
    ?? root.querySelector(".action-buttons");
  if (footer) footer.appendChild(btn);
  else root.appendChild(btn); // block element at the bottom — never in the header flex
});

// Launcher #2: a scene-control tool. v13+ passes controls as an object keyed by
// group, with tools keyed by name; a `button` tool fires onChange when clicked.
Hooks.on("getSceneControlButtons", controls => {
  const group = controls?.tokens;
  if (!group?.tools || ("heisty-build-spider" in group.tools)) return;
  group.tools["heisty-build-spider"] = {
    name: "heisty-build-spider",
    title: "Build a Spider",
    icon: "fa-solid fa-spider",
    order: Object.keys(group.tools).length,
    button: true,
    visible: true,
    onChange: () => game.heistySpideys?.openBuilder?.()
  };
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
