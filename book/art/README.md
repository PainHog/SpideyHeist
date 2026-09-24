# Book art

All art is hand-built SVG, inlined at build time wherever the chapters say
`<figure class="art" data-art="NAME">`. The house style is storybook heist-noir:
confident ink linework over flat fills, in the **heist-noir** palette shared with the Foundry system
(charcoal and near-black, signal red for danger, gold for loot and light, on warm paper).
Every piece must pass `ART-CHECKLIST.md`.
Every SVG has a `viewBox` and **no** fixed width or height; the CSS sizes it.

| Token | Hex | Use |
|---|---|---|
| plum *(charcoal)* | `#36343a` | primary fill, spider bodies |
| plum-deep *(near-black)* | `#1f1d22` | shadows, night sky, dark bands |
| plum-soft *(graphite)* | `#5a5660` | highlights on charcoal |
| cream | `#f3eee4` | page, light fills |
| parchment | `#e6dccb` | secondary light fill |
| parch-edge | `#cdbfa4` | soft lines on light |
| ink | `#141216` | linework, text |
| gold | `#b8892a` | accents, silk, loot |
| gold-bright | `#f0cf6b` | glints, eyes, highlights |
| ox *(signal red, dark)* | `#8f1d1d` | danger, alert, threat |
| ox-bright *(signal red)* | `#d13a2f` | alarms |
| good | `#2f7d4f` | calm/safe (sparingly) |

## Catalogue

**Full-page and title art**
- `cover`: cover illustration (portrait; 612×792 aspect)
- `part-one`, `part-two`: part title spot illustrations (wide)

**Chapter vignettes** (wide, about 3:1, sit above each chapter title)

| Chapter | Name |
|---|---|
| 1 | `ch-welcome` |
| 2 | `ch-dice` |
| 3 | `ch-grid` |
| 4 | `ch-species` |
| 5 | `ch-roles` |
| 6 | `ch-attributes` |
| 7 | `ch-builder` |
| 8 | `ch-silk` |
| 9 | `ch-alert` |
| 10 | `ch-vitality` |
| 11 | `ch-heist` |
| 12 | `ch-gadgets` |
| 13 | `ch-running` |
| 14 | `ch-location` |
| 15 | `ch-obstacles` |
| 16 | `ch-creatures` |
| 17 | `ch-phases` |
| 18 | `ch-alert-play` |
| 19 | `ch-heists` |
| 20 | `ch-tables` |
| 21 | `ch-quickref` |

**Portraits and badges** (square)
- Species: `species-jumping`, `species-orb`, `species-wolf`, `species-cellar`, `species-spitting`, `species-crab`
- Roles: `role-face`, `role-ghost`, `role-tinkerer`, `role-bruiser`, `role-lookout`, `role-wheelman`, `role-grifter`
- Creatures: `creature-cat`, `creature-dog`, `creature-vacuum`, `creature-child`, `creature-guard-spider`, `creature-snake`, `creature-parrot`, `creature-rat`, `creature-exterminator`, `creature-goldfish`

**Diagrams and ornaments**
- `map-cookie`: Heist 1 sample map (grid; see the spec in the art brief)
- `alert-track`: the Alert bands, Calm → Full Alert (wide)
- `vitality-track`: Unharmed → Out (wide)
- `dice-success`: a d6 row showing that 4/5/6 are Successes (wide)
- `orn-divider`: a horizontal section divider (very wide, thin)
- `orn-corner`: a cobweb corner flourish (square; the top-left corner, CSS flips it)
- `orn-spider`: a tiny dangling spider on a thread (tall, narrow)

**Spot illustrations** (fill end-of-chapter space; ~4:3, placed automatically by the build)
- `spot-crew-huddle`, `spot-cat-nap`, `spot-vacuum-ride`, `spot-jar-rescue`, `spot-silk-swing`,
  `spot-lockpick`, `spot-loot-haul`, `spot-dice-push`, `spot-lookout-sill`, `spot-dust-bunny`,
  `spot-alarm-freeze`, `spot-debrief`, `spot-map-board`, `spot-couch-sneak`
