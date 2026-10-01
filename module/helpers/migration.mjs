/**
 * HEISTY SPIDEYS — World Migration
 * --------------------------------
 * Foundry does NOT rewrite stored documents when a DataModel schema changes.
 * - Adding a new field with a schema default needs NO migration.
 * - Renaming or restructuring stored data DOES: register a migration below.
 *
 * Migrations are version-keyed, GM-only, and idempotent. When the new schema
 * would coerce the old shape away before a migration runs, read the raw
 * pre-migration data from `doc._source`.
 */

import { HEISTY } from "../config.mjs";
import { slugKey } from "../logic/keys.mjs";

/* -------------------------------------------- */
/*  1.8.0 planners (pure, unit-tested)          */
/* -------------------------------------------- */

/** Creature compendium keys (packs/_source/creatures). */
export const THREAT_KEYS = Object.freeze([
  "alert-parrot", "corn-snake", "curious-child", "goldfish", "guard-spider", "house-cat",
  "house-dog", "human", "protection-rat", "the-exterminator", "vacuum"
]);

/** Name aliases a GM might have typed ("The Rat" is the protection-rat stat block). */
const THREAT_ALIASES = Object.freeze({
  "the-rat": "protection-rat", rat: "protection-rat", "protection-rat": "protection-rat",
  exterminator: "the-exterminator", cat: "house-cat", dog: "house-dog", parrot: "alert-parrot",
  snake: "corn-snake", child: "curious-child", "guard": "guard-spider", "the-vacuum": "vacuum",
  "robot-vacuum": "vacuum", "the-goldfish": "goldfish", "the-human": "human"
});

/**
 * The creature-table key for a threat's name, or "" if it isn't one.
 * @param {string} name
 * @param {(n:string)=>string|null} [resolver]  WP-C's resolveCreatureKey, when loaded.
 */
export function threatKeyFor(name, resolver = null) {
  try {
    const r = resolver?.(name);
    if (r) return r;
  } catch (err) { /* fall back to the local table */ }
  const s = slugKey(name);
  if (THREAT_KEYS.includes(s)) return s;
  return THREAT_ALIASES[s] ?? "";
}

/** Update for one Perk/Flaw item's source, or null if nothing to do. */
export function planItemMigration(src) {
  if (!src || (src.type !== "perk" && src.type !== "flaw")) return null;
  if (src.system?.key) return null;
  const key = slugKey(src.name);
  return key ? { _id: src._id, "system.key": key } : null;
}

/**
 * Updates for one actor's source: its own fields and its embedded items.
 * @returns {{update:object|null, items:object[]}}
 */
export function planActorMigration(src, resolver = null) {
  const items = (src?.items ?? []).map(planItemMigration).filter(Boolean);
  let update = null;
  if (src?.type === "spider" && !src.system?.heist?.slot && src._id) {
    update = { "system.heist.slot": src._id };
  }
  if (src?.type === "threat" && !src.system?.automation?.key) {
    const key = threatKeyFor(src.name, resolver);
    if (key) update = { "system.automation.key": key };
  }
  return { update, items };
}

/**
 * Ordered list of migrations. Add an entry when a release restructures stored
 * data, e.g.:
 *   {
 *     version: "1.1.0",
 *     async migrate() {
 *       for (const actor of game.actors) {
 *         const src = actor._source;              // pre-migration shape
 *         if (src.system?.oldField === undefined) continue;
 *         // Deleting a key: v14 uses the `_del` (ForcedDeletion) operator; the
 *         // "-=" key form is deprecated there but is the only form v13 knows.
 *         const del = globalThis._del !== undefined
 *           ? { "system.oldField": _del } : { "system.-=oldField": null };
 *         await actor.update({ "system.newField": src.system.oldField, ...del });
 *       }
 *     }
 *   }
 */
const MIGRATIONS = [
  {
    // Heist automation: stable ability keys on Perks/Flaws, a player slot on
    // every spider, and the creature-table key on threats. Idempotent.
    version: "1.8.0",
    async migrate() {
      let resolver = null;
      try {
        const mod = await import("../logic/creatures.mjs");
        resolver = typeof mod.resolveCreatureKey === "function" ? mod.resolveCreatureKey : null;
      } catch (err) { resolver = null; }

      const itemUpdates = game.items.map(i => planItemMigration(i._source)).filter(Boolean);
      if (itemUpdates.length) await Item.updateDocuments(itemUpdates);

      for (const actor of game.actors) {
        const src = actor._source ?? actor.toObject();
        const plan = planActorMigration(src, resolver);
        if (plan.update) await actor.update(plan.update);
        if (plan.items.length) await actor.updateEmbeddedDocuments("Item", plan.items);
      }
    }
  }
];

const isNewer = (a, b) => foundry.utils.isNewerVersion(a, b);

export async function migrateWorld() {
  // Gate to the SINGLE active GM — not just any GM — so two GMs loading at once
  // can't both run a document-creating migration.
  if (game.users.activeGM?.id !== game.user.id) return;
  const current = game.system.version;
  const last = game.settings.get(HEISTY.id, "systemMigrationVersion");

  // Fresh world (or first run with this system): nothing to migrate.
  if (!last) {
    await game.settings.set(HEISTY.id, "systemMigrationVersion", current);
    return;
  }
  if (!isNewer(current, last)) return;

  const pending = MIGRATIONS
    .filter(m => isNewer(m.version, last))
    .sort((a, b) => (isNewer(a.version, b.version) ? 1 : -1));

  if (pending.length) {
    ui.notifications?.info(`Heisty Spideys: migrating world ${last} → ${current}…`);
    for (const m of pending) {
      try {
        await m.migrate();
      } catch (err) {
        console.error(`Heisty Spideys | Migration ${m.version} failed:`, err);
        ui.notifications?.error(`Heisty Spideys: migration ${m.version} failed — see console (F12).`);
        return; // Leave the stamp behind so it can be retried after a fix.
      }
    }
    ui.notifications?.info("Heisty Spideys: migration complete.");
  }

  await game.settings.set(HEISTY.id, "systemMigrationVersion", current);
}
