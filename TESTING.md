# Testing — Heisty Spideys

Static checks (`npm run check`) catch schema/pack/template regressions, and the
pure logic is unit-tested (`npm test`). But **the hard bugs live in the GM↔player
seam and never show up single-player.** Before shipping anything that touches
multiplayer, run the two-client smoke test below with an actual second browser.

## Automated (run before every commit)

```bash
npm run check   # validate (manifest, packs, compiled-matches-source, templates) + unit tests
```

CI runs the same on every push.

## Two-client smoke test (GM + player)

Open the world as the **GM** in one browser, and join as a **non-GM Player** in a
second browser (a private/incognito window works). Do NOT give the player
"Create New Actors" for the first pass — that's the important case.

1. **Player builds a spider (no create permission).**
   - Player: *Actors → Build a Spider* (or the spider tool in the canvas toolbar) → finish the wizard → **Create Spider**.
   - Expect: player sees *"Sent … to the Storyteller — pending their confirmation…"* (never "done").
   - Expect: the spider appears, owned by the player, and its sheet opens on the player's screen. GM sees it in the Actors directory.
2. **No GM online.** Repeat step 1 with the GM browser closed. Expect a clear
   *"No Storyteller is online…"* error — not a silent success.
3. **Player WITH create permission.** Grant Players *Create New Actors*
   (*Settings → Configure Permissions*), reload the player. Build again.
   Expect an immediate direct create (no relay), sheet opens.
4. **Rolling.** On the player's spider sheet, click a Skill → set a Difficulty →
   roll. Expect a chat card both clients see. GM sees the Alert ± buttons on the
   card; the player does not.
5. **The Alert.** GM drags the Alert meter somewhere and changes the value.
   Expect the player's meter to update to the same number, read-only, and each
   client remembers its own meter position across reload.
6. **Threats & secrets.** As the player, open the Compendium sidebar. Expect the
   **Creature Compendium** and **Five Ready-to-Run Heists** to be **absent**
   (GM-only). Species/Roles/Perks/Flaws/Gadgets/Rules should be visible.
7. **Sheets scroll.** Resize a spider sheet small. Expect the tab body to
   scroll, not clip.

## When something breaks live

- Open the browser console (**F12**) and look for errors mentioning
  `heisty-spideys` / `Heisty Spideys`.
- Check whether Foundry itself updated (system code runs only inside a launched
  world — not on the setup or `/join` screens).
- Commits are small and version-tagged; bisect and revert one release rather
  than a batch.
