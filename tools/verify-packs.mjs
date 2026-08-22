/** Quick read-back check of the compiled LevelDB packs. */
import { ClassicLevel } from "classic-level";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "packs");
const PACKS = ["species", "roles", "perks", "flaws", "gadgets", "creatures", "heists", "rules"];

for (const name of PACKS) {
  const db = new ClassicLevel(join(OUT, name), { keyEncoding: "utf8", valueEncoding: "json" });
  let primary = 0, pages = 0, sample = null, badId = null;
  for await (const [key, val] of db.iterator()) {
    if (key.includes(".pages!")) pages++;
    else { primary++; if (!sample) sample = val; }
    if (!/^[a-zA-Z0-9]{16}$/.test(val._id)) badId = val._id;
  }
  await db.close();
  console.log(`${name.padEnd(10)} primary=${String(primary).padStart(3)} pages=${String(pages).padStart(3)}`
    + `  e.g. "${sample?.name}"` + (badId ? `  !! bad id ${badId}` : ""));
}
console.log("verify complete.");
