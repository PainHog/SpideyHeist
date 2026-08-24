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

/**
 * Ordered list of migrations. Add an entry when a release restructures stored
 * data, e.g.:
 *   {
 *     version: "1.1.0",
 *     async migrate() {
 *       for (const actor of game.actors) {
 *         const src = actor._source;              // pre-migration shape
 *         if (src.system?.oldField === undefined) continue;
 *         await actor.update({ "system.newField": src.system.oldField,
 *                              "system.-=oldField": null });
 *       }
 *     }
 *   }
 */
const MIGRATIONS = [];

const isNewer = (a, b) => foundry.utils.isNewerVersion(a, b);

export async function migrateWorld() {
  if (!game.user.isGM) return;

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
