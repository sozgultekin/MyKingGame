import {
  type Card,
  type PlayerId,
  legalPlays,
  sameCard,
} from "@mykinggame/game-core";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PlayingCard } from "../src/ui/Card";
import { HandPickerModal } from "../src/ui/HandPickerModal";
import { HandSummaryModal } from "../src/ui/HandSummaryModal";
import { PLAYER_NAMES, PlayerSeat } from "../src/ui/PlayerSeat";
import { PrivacyCurtain } from "../src/ui/PrivacyCurtain";
import { TrickArea } from "../src/ui/TrickArea";
import { TrumpPickerModal } from "../src/ui/TrumpPickerModal";
import { useLocalGame } from "../src/store/localGameStore";

const SUIT_NAME: Record<string, string> = {
  C: "♣ Sinek",
  D: "♦ Karo",
  H: "♥ Kupa",
  S: "♠ Maça",
};
const ALL_PLAYERS: PlayerId[] = [0, 1, 2, 3];
const TRICK_VIEW_MS = 1300;

export default function LocalGameScreen() {
  const game = useLocalGame((s) => s.game);
  const startNewGame = useLocalGame((s) => s.startNewGame);
  const pickHand = useLocalGame((s) => s.pickHand);
  const pickTrump = useLocalGame((s) => s.pickTrump);
  const playCard = useLocalGame((s) => s.playCard);
  const collectTrick = useLocalGame((s) => s.collectTrick);
  const advanceAfterHand = useLocalGame((s) => s.advanceAfterHand);

  const [privacyOn, setPrivacyOn] = useState(true);
  const [revealedFor, setRevealedFor] = useState<PlayerId | null>(null);

  useEffect(() => {
    if (!game) startNewGame();
  }, [game, startNewGame]);

  // Auto-collect the completed trick after a short beat so it's visible.
  useEffect(() => {
    if (game?.phase.kind !== "trick-complete") return;
    const t = setTimeout(collectTrick, TRICK_VIEW_MS);
    return () => clearTimeout(t);
  }, [game?.phase.kind, collectTrick]);

  if (!game) return null;

  const phase = game.phase;
  const handType = useMemo(() => {
    if (
      phase.kind === "play" ||
      phase.kind === "trick-complete" ||
      phase.kind === "hand-summary" ||
      phase.kind === "pick-trump"
    ) {
      return game.options.handTypes.find((h) => h.id === phase.handTypeId);
    }
    return undefined;
  }, [phase, game.options.handTypes]);

  const activeActor: PlayerId | null =
    phase.kind === "play"
      ? phase.turn
      : phase.kind === "pick-hand" || phase.kind === "pick-trump"
        ? game.chooser
        : null;

  const hand: readonly Card[] = activeActor !== null ? game.playerCards[activeActor] : [];
  const legal = useMemo(() => {
    if (phase.kind !== "play" || activeActor === null) return [];
    return legalPlays(hand, phase.currentTrick);
  }, [phase, activeActor, hand]);
  const isLegalCard = (c: Card) => legal.some((l) => sameCard(l, c));

  const needsReveal =
    privacyOn && activeActor !== null && revealedFor !== activeActor;
  const trump =
    phase.kind === "play"
      ? phase.trump
      : phase.kind === "trick-complete"
        ? phase.trump
        : undefined;

  const onPlay = (card: Card) => {
    if (activeActor === null) return;
    playCard(activeActor, card);
    setRevealedFor(null);
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.handLabel}>
          {handType ? handType.name : "El seçiliyor..."}
        </Text>
        <View style={styles.topRight}>
          <Pressable onPress={() => setPrivacyOn((v) => !v)} style={styles.privacyToggle}>
            <Text style={styles.privacyText}>
              {privacyOn ? "Gizli" : "Açık"} el
            </Text>
          </Pressable>
          <Text style={styles.handsCount}>
            {game.handsPlayed + 1} / {game.options.totalHands}
          </Text>
        </View>
      </View>

      <View style={styles.seatsRow}>
        {ALL_PLAYERS.map((p) => (
          <PlayerSeat
            key={p}
            player={p}
            isChooser={game.chooser === p}
            isTurn={activeActor === p && phase.kind === "play"}
            total={game.totals[p]}
          />
        ))}
      </View>

      <View style={styles.middle}>
        {phase.kind === "play" && (
          <TrickArea
            plays={phase.currentTrick.plays}
            trump={trump ? SUIT_NAME[trump] : undefined}
          />
        )}
        {phase.kind === "trick-complete" && (
          <TrickArea
            plays={phase.lastTrick.plays}
            trump={trump ? SUIT_NAME[trump] : undefined}
            winner={phase.lastTrick.winner}
          />
        )}
      </View>

      {activeActor !== null && phase.kind === "play" && (
        <View style={styles.handContainer}>
          <Text style={styles.handLabel}>{PLAYER_NAMES[activeActor]} oynayacak</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.handScroll}
          >
            {sortHand(hand).map((card) => {
              const legalNow = isLegalCard(card);
              return (
                <View key={`${card.rank}${card.suit}`} style={styles.cardWrap}>
                  <PlayingCard
                    card={card}
                    size="md"
                    disabled={!legalNow}
                    onPress={legalNow ? () => onPlay(card) : undefined}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <HandPickerModal
        visible={phase.kind === "pick-hand" && !needsReveal}
        options={game.options.handTypes}
        remainingIds={game.remainingHandTypeIds}
        chooserName={PLAYER_NAMES[game.chooser]}
        onPick={(id) => {
          pickHand(id);
          setRevealedFor(null);
        }}
      />

      <TrumpPickerModal
        visible={phase.kind === "pick-trump" && !needsReveal}
        chooserName={PLAYER_NAMES[game.chooser]}
        onPick={(suit) => {
          pickTrump(suit);
          setRevealedFor(null);
        }}
      />

      {phase.kind === "hand-summary" && (
        <HandSummaryModal
          visible
          handName={handType?.name ?? phase.handTypeId}
          scores={phase.scores}
          totals={addAll(game.totals, phase.scores)}
          isFinal={false}
          onAdvance={advanceAfterHand}
          onNewGame={() => startNewGame()}
        />
      )}

      {phase.kind === "game-over" && (
        <HandSummaryModal
          visible
          handName="Final"
          scores={game.scoreSheet.at(-1)?.scores ?? game.totals}
          totals={game.totals}
          isFinal
          onAdvance={advanceAfterHand}
          onNewGame={() => startNewGame()}
        />
      )}

      <PrivacyCurtain
        visible={needsReveal}
        playerName={activeActor !== null ? PLAYER_NAMES[activeActor] : ""}
        onReveal={() => activeActor !== null && setRevealedFor(activeActor)}
      />

      <Pressable
        style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}
        onPress={() => startNewGame()}
      >
        <Text style={styles.resetText}>Yeni Oyun</Text>
      </Pressable>
    </View>
  );
}

function sortHand(cards: readonly Card[]): Card[] {
  const order: Record<string, number> = { C: 0, D: 1, H: 2, S: 3 };
  const rankOrder = "23456789TJQKA";
  return cards.slice().sort((a, b) => {
    const s = order[a.suit]! - order[b.suit]!;
    if (s !== 0) return s;
    return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });
}

function addAll(
  a: Record<PlayerId, number>,
  b: Record<PlayerId, number>,
): Record<PlayerId, number> {
  return { 0: a[0] + b[0], 1: a[1] + b[1], 2: a[2] + b[2], 3: a[3] + b[3] };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b3d2e", padding: 12, gap: 8 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  handLabel: { color: "#f5e9c8", fontSize: 16, fontWeight: "700" },
  handsCount: { color: "#d4af37", fontSize: 14, fontWeight: "600" },
  privacyToggle: {
    borderColor: "#1d5c46",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  privacyText: { color: "#a8c5b6", fontSize: 11 },
  seatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  middle: { flex: 1, alignItems: "center", justifyContent: "center" },
  handContainer: { gap: 8 },
  handScroll: { gap: 6, paddingVertical: 8 },
  cardWrap: { width: 56 },
  resetBtn: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderColor: "#1d5c46",
    borderWidth: 1,
    borderRadius: 8,
  },
  resetText: { color: "#a8c5b6", fontSize: 12 },
});
