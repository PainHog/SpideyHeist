# Book art

All art is hand-built SVG, inlined at build time wherever the chapters say
`<figure class="art" data-art="NAME">`. The house style is storybook heist-noir:
confident ink linework over flat fills, the same palette as the Foundry system.
Every SVG has a `viewBox` and **no** fixed width or height; the CSS sizes it.

| Token | Hex | Use |
|---|---|---|
| plum | `#5f2470` | primary fill, spider bodies |
| plum-deep | `#3a1348` | shadows, night sky, dark bands |
| plum-soft | `#7b3a8e` | highlights on plum |
| cream | `#f6efdd` | page, light fills |
| parchment | `#eaddbe` | secondary light fill |
| parch-edge | `#d9c69a` | soft lines on light |
| ink | `#2a1c30` | linework, text |
| gold | `#b8892a` | accents, silk, loot |
| gold-bright | `#f0cf6b` | glints, eyes, highlights |
| ox | `#7a2231` | danger, alert, threat |
| ox-bright | `#b2364a` | alarms |
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
