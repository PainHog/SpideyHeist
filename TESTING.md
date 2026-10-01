# Testing — Heisty Spideys

Static checks (`npm run check`) catch schema/pack/template regressions, and the
pure logic is unit-tested (`npm test`). But **the hard bugs live in the GM↔player
seam and never show up single-player.** Before shipping anything that touches
multiplayer, run the two-client smoke test below with an actual second browser.

## Automated (run before every commit)

```bash
npm run check   # validate (manifest, packs, compiled-matches-source, templates) + unit tests
```

CI runs the same on every push. Two of the tests guard the automation seams:

- `test/contracts.test.mjs` — every GM operation is registered exactly once, every
  card kind has one renderer and a template, every setting is registered and has
  its name and hint in `lang/en.json`, and the ability keys the dice use exist.
- `test/integration-smoke.test.mjs` — boots the real system on a fake, deterministic
  Foundry (`tools/fake-foundry.mjs`) with a GM and two players and plays a heist
  end to end, every click made as the user who would make it (players can only
  write what they own). It catches wiring and permission bugs, **not** real
  Foundry behaviour — that's what the two-client test below is for.

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
   roll. Expect a chat card both clients see. The GM sees the ST buttons
   (Spotted / Confirmed / Loud…) on the card; the player sees only their own
   (Reroll, Accept…). With the *Automatic Alert* setting on **Manual**, the GM
   sees the old Alert ± buttons instead.
5. **The Alert.** GM drags the Alert meter somewhere and changes the value.
   Expect the player's meter to update to the same number, read-only, and each
   client remembers its own meter position across reload.
6. **Threats & secrets.** As the player, open the Compendium sidebar. Expect the
   **Creature Compendium** and **Five Ready-to-Run Heists** to be **absent**
   (GM-only). Species/Roles/Perks/Flaws/Gadgets/Rules should be visible.
7. **Sheets scroll.** Resize a spider sheet small. Expect the tab body to
   scroll, not clip.

## Automation smoke test (1.8.0) — GM + two players

Use the same setup with **two** player browsers (call them Pat and Robin), each
owning one spider; give Pat's spider the **Face** role and Robin's the
**Bruiser** role with the *Take the Hit* Perk. Leave every automation setting at
its default except *Hits after a Failure* → **Automatic**. Keep the browser
console (F12) open on all three; any red error is a failure.

1. **Start.** GM: open the **Heist Tracker** (route icon in the token controls)
   → pick *The Cookie Situation*, both spiders ticked → **Start Heist**.
   Expect: both spiders at full Silk and Unharmed, Alert 0 / Limit 10, a
   whispered "Which tin" card for the GM only, the House Cat in the Actors
   directory. Players open the tracker too and see the phase, not the GM's notes.
2. **Planning.** GM: phase → **Planning**. Pat rolls Perception. Expect no Alert
   change and a GM-only **Casing** prompt with details pre-ticked → **Reveal to
   the crew** → both players see "The crew learns…".
3. **Silk dice.** GM: phase → **Heist** (the first obstacle starts; the cat is
   awake). Pat rolls Stealth, picks the Stealth approach (the cat rolls first and
   sets the Difficulty), adds **2 Silk dice**. Expect Pat's SP to drop by 2 on
   both clients the moment the card appears.
4. **Reroll.** On Pat's own card: **Reroll (2 SP)**. Expect SP −2 again, the
   rerolled dice marked, the Successes kept, and the Alert re-applied (a pass
   takes the Failure's +1 back off).
5. **One event, one trigger.** Robin rolls Stealth and fails: Alert +1. GM clicks
   **Spotted +1** on that card: the Alert stays +1 for that roll.
6. **A reaction across players.** On Robin's card Pat sees **That's Not What
   Happened (2 SP) — <Pat's spider>**; click it. Expect the Alert back down by 1,
   Pat's SP −2, the cancel noted on Robin's card (Pat didn't write that card —
   the GM's client did), and the button gone for the rest of the heist.
7. **End Round with an awake cat.** The GM gets "Round 1: everyone has acted" →
   **End round**. Expect the Alert +1 (the cat), round 2, and — because Robin
   failed with the cat engaged — the cat's **attack card** on Robin.
8. **Shrug-off.** Robin clicks **Shrug it off**. Expect a shrug card from Robin,
   Robin's Vitality changing on all three clients, and the attack card noting it.
   Try **Reroll (2 SP)** on the shrug card: the Vitality is re-applied from the
   same starting point.
9. **Take the Hit.** GM: target Pat's token, open the House Cat's sheet and click
   its **Pounce** pool (with a spider targeted, a pool click is an attack on it).
   Robin sees **Take the Hit — <Robin's spider>**; click it. Expect the card to
   retarget to Robin's spider, and Robin shrugs.
10. **Round 3.** End the round twice more at the same obstacle. Expect a
    **Mid-Heist Complication** card when round 3 starts, with its effect applied.
11. **Out and the Waiting Web.** GM: set Robin's spider to Hurt, attack it again,
    Robin shrugs badly. Expect: Out, the Alert +2, an **Alert spike** card, the
    token hidden, and on **Robin's** screen the Waiting Web window (name, species
    swap). Answer it. Expect the replacement in the Actors directory, owned by
    Robin, Rattled, half starting Silk, status Waiting Web.
12. **Damage Control split.** On the spike card, Pat chips in 1 and Robin (using
    the replacement) chips in 2. Expect the spike reduced by 1 once the pledges
    reach 3, both players' SP down by what they pledged.
13. **Next obstacle.** GM: **Next obstacle**. Expect the replacement placed next to
    a crewmate (if tokens are on the scene) and its status On the board.
14. **Silk Clutch.** Pat fails a roll, clicks **Silk Clutch (3 SP)**. Expect a
    Success, the Clutch's +1 instead of the Failure's +1, and the obstacle's
    progress counting it.
15. **Group check.** GM: **Group check** on an approach; for a creature approach
    click "… rolls once for the round". Each player clicks **Roll** on the group
    card. Expect the Alert to rise once, by the largest single trigger.
16. **Debrief.** GM: phase → **Escape**, then → **Debrief** → **Award AP** on the
    Debrief card. Expect AP on Pat's spider **and on both** of Robin's spiders
    (the original and the replacement), and the tracker back to "No heist running".
17. **GM offline.** GM closes their browser. Pat rolls and fails. Expect no Alert
    change yet. GM logs back in: within a moment the Alert rises by 1.
18. **Switch it off.** GM: set *Automatic Alert* to **Manual** and *Deduct Silk
    automatically* off. Roll with Silk dice: SP unchanged, the card shows the
    cost as advice, and the GM gets ± Alert buttons on the card.

## When something breaks live

- Open the browser console (**F12**) and look for errors mentioning
  `heisty-spideys` / `Heisty Spideys`.
- Check whether Foundry itself updated (system code runs only inside a launched
  world — not on the setup or `/join` screens).
- Commits are small and version-tagged; bisect and revert one release rather
  than a batch.
