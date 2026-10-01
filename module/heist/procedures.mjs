/**
 * HEISTY SPIDEYS — Heist procedures (design §4)
 * ---------------------------------------------
 * The heists' own d6 tables and timers (Ch 19): Heist 1's twin tin and water
 * run, Heist 2's guard lap and the cleaners' 6-round timer, Heist 4's
 * librarian, Heist 5's staff, the Rat's deal and the sleeper. The automation
 * rolls them when their trigger fires (setting autoProcedures) and whispers the
 * result to the GM on a procedure card; manual ones get one-click outcome
 * buttons on the tracker.
 */

import { procedureOutcome } from "../logic/heist-catalog.mjs";

/** Roll n d6 with Foundry's dice (falls back to Math.random outside Foundry). */
export async function rollD6(n = 1) {
  const count = Math.max(1, Math.round(Number(n) || 1));
  try {
    const roll = await new Roll(`${count}d6`).evaluate();
    return roll.dice[0].results.map(r => r.result);
  } catch (err) {
    return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6));
  }
}

/**
 * Roll a procedure's table (one roll per `rolls`, e.g. per staffer).
 * @returns {Promise<{procId, name, text, rows:{label, roll, text}[], outcomes:object[], timer:object|null}>}
 */
export async function runProcedure(proc, { reason = "" } = {}) {
  const rows = [];
  if (proc?.roll?.table?.length) {
    const n = Math.max(1, Number(proc.rolls) || 1);
    const faces = await rollD6(n);
    faces.forEach((f, i) => rows.push({ label: proc.labels?.[i] ?? (n > 1 ? `Roll ${i + 1}` : ""), roll: f, text: procedureOutcome(proc, f)?.text ?? "" }));
  }
  return {
    procId: proc?.id, name: proc?.name ?? "Procedure", text: proc?.text ?? "", reason,
    rows, outcomes: (proc?.outcomes ?? []).map(o => ({ ...o })), timer: proc?.timer ? { ...proc.timer } : null
  };
}

/** Start a procedure's timer in the heist state (pure). */
export function startTimer(state, proc) {
  if (!proc?.timer) return state;
  const prev = state.procedures?.[proc.id];
  if (prev?.timer && !prev.timer.done) return state;
  return {
    ...state,
    procedures: {
      ...(state.procedures ?? {}),
      [proc.id]: { ...(prev ?? {}), fired: true, timer: { rounds: Number(proc.timer.rounds) || 1, startedRoundSerial: Number(state.roundSerial) || 0, stage: 0, done: false } }
    }
  };
}

/** Mark a procedure fired (for `once` procedures and alert thresholds). */
export function markFired(state, procId, extra = {}) {
  return { ...state, procedures: { ...(state.procedures ?? {}), [procId]: { ...(state.procedures?.[procId] ?? {}), fired: true, ...extra } } };
}

/** Has a `once` procedure already fired this heist? */
export function hasFired(state, procId) {
  return !!state?.procedures?.[procId]?.fired;
}

/**
 * Which stage of a staged timer `elapsed` rounds reach (e.g. the water run:
 * 2 rounds walking, then 1 at the sink). Returns the stage index and text when
 * a new stage begins this round.
 */
export function timerStage(proc, elapsed) {
  const stages = proc?.timer?.stages ?? [];
  let acc = 0;
  for (let i = 0; i < stages.length; i++) {
    if (elapsed === acc) return { index: i, text: stages[i].text, starts: true };
    acc += Number(stages[i].rounds) || 0;
  }
  return null;
}

/** Finish a timer (pure). */
export function endTimer(state, procId) {
  const p = state.procedures?.[procId];
  if (!p?.timer) return state;
  return { ...state, procedures: { ...state.procedures, [procId]: { ...p, timer: { ...p.timer, done: true } } } };
}
