import { describe, expect, it } from "vitest";
import { createRuleBasedBot } from "./bot.js";
import {
  DEFAULT_GAME_OPTIONS,
  type GameState,
  applyAction,
  startGame,
} from "./game.js";
import { type PlayerId } from "./trick.js";

function autoplayFullGame(seed: string): GameState {
  const bot = createRuleBasedBot();
  let g = startGame({ ...DEFAULT_GAME_OPTIONS, seed, totalHands: 3 });
  while (g.phase.kind !== "game-over") {
    switch (g.phase.kind) {
      case "pick-hand": {
        const id = bot.pickHand(g, g.chooser);
        g = applyAction(g, { kind: "pick-hand", handTypeId: id });
        break;
      }
      case "pick-trump": {
        const suit = bot.pickTrump(g, g.chooser);
        g = applyAction(g, { kind: "pick-trump", suit });
        break;
      }
      case "play": {
        const player = g.phase.turn as PlayerId;
        const card = bot.playCard(g, player);
        g = applyAction(g, { kind: "play-card", player, card });
        break;
      }
      case "hand-summary":
        g = applyAction(g, { kind: "advance-after-hand" });
        break;
    }
  }
  return g;
}

describe("rule-based bot", () => {
  it("can play a full game start to finish", () => {
    const g = autoplayFullGame("bot-test");
    expect(g.phase.kind).toBe("game-over");
    expect(g.handsPlayed).toBe(3);
    expect(g.scoreSheet).toHaveLength(3);
  });

  it("produces the same game given the same seed", () => {
    const a = autoplayFullGame("repro");
    const b = autoplayFullGame("repro");
    for (let p = 0; p < 4; p++) {
      const pid = p as PlayerId;
      expect(a.totals[pid]).toBe(b.totals[pid]);
    }
  });

  it("totals match the sum of per-hand scores", () => {
    const g = autoplayFullGame("totals");
    for (let p = 0; p < 4; p++) {
      const pid = p as PlayerId;
      const sum = g.scoreSheet.reduce((s, e) => s + e.scores[pid], 0);
      expect(g.totals[pid]).toBe(sum);
    }
  });
});
