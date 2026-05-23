import {
  isHeart,
  isJackOrKing,
  isKingOfHearts,
  isQueen,
} from "../cards.js";
import type { PlayerId } from "../trick.js";
import {
  type HandContext,
  type HandType,
  type Scores,
  countMatchingPerWinner,
  zeroScores,
} from "./types.js";

// Penalty values used in the default "Klasik Tam King — 10 el" preset.
// All hands are negative (cezalı) by default; the registry below also wires
// up a positive "kozlu" hand for trick-taking. These numbers are encoded once
// here so they're easy to retune for variant rule sets.
const PENALTY = {
  rifki_perTrick: -50, // each trick taken
  kupa_perHeart: -30, // each heart card taken
  kiz_perQueen: -100, // each queen taken
  erkek_perJK: -50, // each jack or king taken
  kupaPapazi: -400, // taking K of hearts
  sonIki_perTrick: -100, // each of the final 2 tricks
  altili_perTrick: -50, // each of the final 6 tricks
  pisli_perTrick: -25, // every card (variant of mixed-target hand)
  kozlu_perTrick: +50, // positive points for each trick taken
} as const;

const rifki: HandType = {
  id: "rifki",
  name: "Rıfkı (El Almama)",
  description: "Hiç el almayın. Alınan her el için ceza.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const out: Record<PlayerId, number> = zeroScores();
    for (const t of resolvedTricks) {
      out[t.winner] += PENALTY.rifki_perTrick;
    }
    return out;
  },
};

const kupa: HandType = {
  id: "kupa",
  name: "Kupa Yememe",
  description: "Kupa almayın. Aldığınız her kupa için ceza.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const counts = countMatchingPerWinner(resolvedTricks, isHeart);
    return scoresFromCounts(counts, PENALTY.kupa_perHeart);
  },
};

const kiz: HandType = {
  id: "kiz",
  name: "Kız Yememe",
  description: "Kız (Q) almayın. Her kız için ceza.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const counts = countMatchingPerWinner(resolvedTricks, isQueen);
    return scoresFromCounts(counts, PENALTY.kiz_perQueen);
  },
};

const erkek: HandType = {
  id: "erkek",
  name: "Erkek Yememe",
  description: "Vale (J) ve Papaz (K) almayın. Her biri için ceza.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const counts = countMatchingPerWinner(resolvedTricks, isJackOrKing);
    return scoresFromCounts(counts, PENALTY.erkek_perJK);
  },
};

const kupaPapazi: HandType = {
  id: "kupa-papazi",
  name: "Kupa Papazı (King)",
  description: "Kupa Papazı (K♥) almayın. Alana büyük ceza.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const out: Record<PlayerId, number> = zeroScores();
    for (const t of resolvedTricks) {
      for (const p of t.plays) {
        if (isKingOfHearts(p.card)) {
          out[t.winner] += PENALTY.kupaPapazi;
        }
      }
    }
    return out;
  },
};

const sonIki: HandType = {
  id: "son-iki",
  name: "Son İki",
  description: "Son iki eli almayın. Her son-iki eli için ceza.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const out: Record<PlayerId, number> = zeroScores();
    const last = resolvedTricks.slice(-2);
    for (const t of last) {
      out[t.winner] += PENALTY.sonIki_perTrick;
    }
    return out;
  },
};

const altili: HandType = {
  id: "altili",
  name: "Altılı (Son 6)",
  description: "Son altı eli almayın. Her son-altı eli için ceza.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const out: Record<PlayerId, number> = zeroScores();
    const last = resolvedTricks.slice(-6);
    for (const t of last) {
      out[t.winner] += PENALTY.altili_perTrick;
    }
    return out;
  },
};

const pisli: HandType = {
  id: "pisli",
  name: "Pisli (Her El Cezalı)",
  description: "Her alınan el küçük ceza taşır — toplam dağılır.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const out: Record<PlayerId, number> = zeroScores();
    for (const t of resolvedTricks) {
      out[t.winner] += PENALTY.pisli_perTrick;
    }
    return out;
  },
};

const kozlu: HandType = {
  id: "kozlu",
  name: "Kozlu (Pozitif)",
  description: "Kozu dağıtıcı belirler. Aldığınız her el +puan getirir.",
  trump: { kind: "chooser" },
  scoreHand({ resolvedTricks }) {
    const out: Record<PlayerId, number> = zeroScores();
    for (const t of resolvedTricks) {
      out[t.winner] += PENALTY.kozlu_perTrick;
    }
    return out;
  },
};

const kozYok: HandType = {
  id: "koz-yok",
  name: "Koz Yok (Pozitif)",
  description: "Kozsuz oynanır. Her el +puan getirir.",
  trump: { kind: "none" },
  scoreHand({ resolvedTricks }) {
    const out: Record<PlayerId, number> = zeroScores();
    for (const t of resolvedTricks) {
      out[t.winner] += PENALTY.kozlu_perTrick;
    }
    return out;
  },
};

function scoresFromCounts(
  counts: Readonly<Record<PlayerId, number>>,
  perUnit: number,
): Scores {
  return {
    0: counts[0] * perUnit,
    1: counts[1] * perUnit,
    2: counts[2] * perUnit,
    3: counts[3] * perUnit,
  };
}

export const DEFAULT_HAND_TYPES: readonly HandType[] = [
  rifki,
  kupa,
  kiz,
  erkek,
  kupaPapazi,
  sonIki,
  altili,
  pisli,
  kozlu,
  kozYok,
];

export const DEFAULT_HAND_TYPES_BY_ID: Readonly<Record<string, HandType>> =
  Object.fromEntries(DEFAULT_HAND_TYPES.map((h) => [h.id, h]));

export type HandContextLike = HandContext;
