/**
 * HEISTY SPIDEYS — Content Importer
 * ---------------------------------
 * The compendiums ship pre-built. This is a safety net: if a pack is empty on
 * first launch (e.g. a build that shipped without compiled packs), the GM can
 * populate it from the bundled source JSON. Runs once automatically, and can be
 * re-run on demand via game.heistySpideys.importContent(true).
 */

import { HEISTY } from "../config.mjs";

const PACK_CONFIG = [
  { pack: "species", cls: "Item", subtype: "species", file: "species" },
  { pack: "roles", cls: "Item", subtype: "role", file: "roles" },
  { pack: "perks", cls: "Item", subtype: "perk", file: "perks" },
  { pack: "flaws", cls: "Item", subtype: "flaw", file: "flaws" },
  { pack: "gadgets", cls: "Item", subtype: "gadget", file: "gadgets" },
  { pack: "creatures", cls: "Actor", subtype: "threat", file: "creatures" },
  { pack: "heists", cls: "JournalEntry", subtype: null, file: "heists" },
  { pack: "rules", cls: "JournalEntry", subtype: null, file: "rules" }
];

function documentClass(name) {
  return { Actor, Item, JournalEntry }[name];
}

function toCreateData(raw, cfg) {
  if (cfg.cls === "JournalEntry") {
    return {
      name: raw.name,
      pages: (raw.pages ?? []).map(p => ({
        name: p.name,
        type: p.type ?? "text",
        title: p.title ?? { show: true, level: 1 },
        text: p.text ?? { format: 1, content: "" }
      }))
    };
  }
  return {
    name: raw.name,
    type: cfg.subtype,
    img: raw.img,
    system: raw.system ?? {}
  };
}

/**
 * Import bundled content into any empty compendium.
 * @param {boolean} force  Re-import even into non-empty packs (creates duplicates).
 */
export async function importContent(force = false) {
  if (!game.user.isGM) {
    ui.notifications?.warn("Only the Storyteller can import compendium content.");
    return;
  }

  let imported = 0;
  for (const cfg of PACK_CONFIG) {
    const pack = game.packs.get(`${HEISTY.id}.${cfg.pack}`);
    if (!pack) continue;

    if (!force) {
      const index = await pack.getIndex();
      if (index.size > 0) continue;
    }

    let raws;
    try {
      raws = await foundry.utils.fetchJsonWithTimeout(`systems/${HEISTY.id}/src/packs/${cfg.file}.json`);
    } catch (err) {
      console.warn(`Heisty Spideys | No bundled source for pack "${cfg.pack}"`, err);
      continue;
    }
    if (!Array.isArray(raws) || !raws.length) continue;

    try {
      const wasLocked = pack.locked;
      if (wasLocked) await pack.configure({ locked: false });
      const cls = documentClass(cfg.cls);
      const created = await cls.createDocuments(raws.map(r => toCreateData(r, cfg)), { pack: pack.collection });
      imported += created.length;
      if (wasLocked) await pack.configure({ locked: true });
    } catch (err) {
      console.error(`Heisty Spideys | Failed to import pack "${cfg.pack}"`, err);
    }
  }

  if (imported > 0) ui.notifications?.info(`Heisty Spideys: imported ${imported} compendium entries.`);
  return imported;
}

/** Auto-populate empty packs once, the first time the world loads with content missing. */
export async function autoImportContent() {
  if (!game.user.isGM) return;
  let done = false;
  try { done = game.settings.get(HEISTY.id, "contentImported"); } catch (e) { /* not registered */ }
  if (done) return;

  // Only import if at least one pack is actually empty (pre-built packs skip this).
  let anyEmpty = false;
  for (const cfg of PACK_CONFIG) {
    const pack = game.packs.get(`${HEISTY.id}.${cfg.pack}`);
    if (!pack) continue;
    const index = await pack.getIndex();
    if (index.size === 0) { anyEmpty = true; break; }
  }

  // Packs already have content (pre-built) — mark done and never re-check.
  if (!anyEmpty) {
    await game.settings.set(HEISTY.id, "contentImported", true);
    return;
  }

  // Something was empty — import, but only mark done if it actually succeeded,
  // so a failed first import is retried on the next load rather than swallowed.
  const imported = await importContent(false);
  if (imported > 0) await game.settings.set(HEISTY.id, "contentImported", true);
}
