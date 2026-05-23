import {
  type Card,
  type PlayerId,
  legalPlays,
  sameCard,
} from "@mykinggame/game-core";
import { useEffect, useMemo } from "react";
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
import { TrickArea } from "../src/ui/TrickArea";
import { TrumpPickerModal } from "../src/ui/TrumpPickerModal";
import { useLocalGame } from "../src/store/localGameStore";

const SUIT_NAME: Record<string, string> = { C: "♣ Sinek", D: "♦ Karo", H: "♥ Kupa", S: "♠ Maça" };
const ALL_PLAYERS: PlayerId[] = [0, 1, 2, 3];

export default function LocalGameScreen() {
  const game = useLocalGame((s) => s.game);
  const startNewGame = useLocalGame((s) => s.startNewGame);
  const pickHand = useLocalGame((s) => s.pickHand);
  const pickTrump = useLocalGame((s) => s.pickTrump);
  const playCard = useLocalGame((s) => s.playCard);
  const advanceAfterHand = useLocalGame((s) => s.advanceAfterHand);

  useEffect(() => {
    if (!game) startNewGame();
  }, [game, startNewGame]);

  if (!game) return null;

  const phase = game.phase;
  const handType = useMemo(() => {
    if (phase.kind === "play" || phase.kind === "hand-summary" || phase.kind === "pick-trump") {
      return game.options.handTypes.find((h) => h.id === phase.handTypeId);
    }
    return undefined;
  }, [phase, game.options.handTypes]);

  const activePlayer: PlayerId | null = phase.kind === "play" ? phase.turn : null;
  const hand: readonly Card[] = activePlayer !== null ? game.playerCards[activePlayer] : [];
  const legal = useMemo(() => {
    if (phase.kind !== "play" || activePlayer === null) return [];
    return legalPlays(hand, phase.currentTrick);
  }, [phase, activePlayer, hand]);

  const isLegalCard = (c: Card) => legal.some((l) => sameCard(l, c));

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.handLabel}>
          {handType ? handType.name : "El seçiliyor..."}
        </Text>
        <Text style={styles.handsCount}>
          {game.handsPlayed + 1} / {game.options.totalHands}
        </Text>
      </View>

      <View style={styles.seatsRow}>
        {ALL_PLAYERS.map((p) => (
          <PlayerSeat
            key={p}
            player={p}
            isChooser={game.chooser === p}
            isTurn={activePlayer === p}
            total={game.totals[p]}
          />
        ))}
      </View>

      {phase.kind === "play" && (
        <TrickArea
          trick={phase.currentTrick}
          trump={phase.trump ? SUIT_NAME[phase.trump] : undefined}
        />
      )}

      {activePlayer !== null && (
        <View style={styles.handContainer}>
          <Text style={styles.handLabel}>
            {PLAYER_NAMES[activePlayer]} oynayacak
          </Text>
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
                    onPress={legalNow ? () => playCard(activePlayer, card) : undefined}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <HandPickerModal
        visible={phase.kind === "pick-hand"}
        options={game.options.handTypes}
        remainingIds={game.remainingHandTypeIds}
        chooserName={PLAYER_NAMES[game.chooser]}
        onPick={pickHand}
      />

      <TrumpPickerModal
        visible={phase.kind === "pick-trump"}
        chooserName={PLAYER_NAMES[game.chooser]}
        onPick={pickTrump}
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
  handLabel: { color: "#f5e9c8", fontSize: 16, fontWeight: "700" },
  handsCount: { color: "#d4af37", fontSize: 14, fontWeight: "600" },
  seatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  handContainer: { marginTop: "auto", gap: 8 },
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
