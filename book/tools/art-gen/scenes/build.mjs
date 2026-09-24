import { writeFileSync } from "node:fs";
import { ART } from "./lib.mjs";
const mods = ["./cover.mjs", "./parts.mjs", "./vig1.mjs", "./vig2.mjs", "./vig3.mjs", "./diagrams.mjs"];
const map = {};
const PIECE = /^(cover|part_|ch_|map_|dice_|alert_|vitality_|orn_)/;
for (const m of mods) {
  let mm; try { mm = await import(m); } catch (e) { if (e.code === "ERR_MODULE_NOT_FOUND" && e.message.includes(m.slice(2))) continue; throw e; }
  for (const [k, v] of Object.entries(mm)) if (typeof v === "function" && PIECE.test(k)) map[k.replace(/_/g, "-")] = v;
}
const want = process.argv.slice(2);
for (const name of (want.length ? want : Object.keys(map))) {
  if (!map[name]) { console.error("no piece", name); process.exitCode = 1; continue; }
  const out = map[name]();
  if (/<image|<script|feTurbulence|href="http|width="\d+" height="\d+" (?:role|viewBox)/.test(out)) console.error("WARN forbidden content in", name);
  writeFileSync(ART + name + ".svg", out);
  console.log("wrote", name, out.length);
}
