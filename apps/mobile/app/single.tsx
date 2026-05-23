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
import { CardBack, PlayingCard } from "../src/ui/Card";
import { HandPickerModal } from "../src/ui/HandPickerModal";
import { HandSummaryModal } from "../src/ui/HandSummaryModal";
import { PLAYER_NAMES, PlayerSeat } from "../src/ui/PlayerSeat";
import { TrickArea } from "../src/ui/TrickArea";
import { TrumpPickerModal } from "../src/ui/TrumpPickerModal";
import { HUMAN, nextBotAction, useSingleGame } from "../src/store/singleGameStore";

const SUIT_NAME: Record<string, string> = {
  C: "♣ Sinek",
  D: "♦ Karo",
  H: "♥ Kupa",
  S: "♠ Maça",
};
const ALL_PLAYERS: PlayerId[] = [0, 1, 2, 3];
const BOT_DELAY_MS = 700;

export default function SinglePlayerScreen() {
  const game = useSingleGame((s) => s.game);
  const startNewGame = useSingleGame((s) => s.startNewGame);
  const pickHand = useSingleGame((s) => s.pickHand);
  const pickTrump = useSingleGame((s) => s.pickTrump);
  const playCard = useSingleGame((s) => s.playCard);
  const advanceAfterHand = useSingleGame((s) => s.advanceAfterHand);
  const stepBot = useSingleGame((s) => s.stepBot);

  useEffect(() => {
    if (!game) startNewGame();
  }, [game, startNewGame]);

  useEffect(() => {
    if (!game) return;
    if (!nextBotAction(game)) return;
    const t = setTimeout(stepBot, BOT_DELAY_MS);
    return () => clearTimeout(t);
  }, [game, stepBot]);

  if (!game) return null;

  const phase = game.phase;
  const handType = useMemo(() => {
    if (phase.kind === "play" || phase.kind === "hand-summary" || phase.kind === "pick-trump") {
      return game.options.handTypes.find((h) => h.id === phase.handTypeId);
    }
    return undefined;
  }, [phase, game.options.handTypes]);

  const turn: PlayerId | null = phase.kind === "play" ? phase.turn : null;
  const humanHand = game.playerCards[HUMAN];
  const legal = useMemo(() => {
    if (phase.kind !== "play" || turn !== HUMAN) return [];
    return legalPlays(humanHand, phase.currentTrick);
  }, [phase, turn, humanHand]);
  const isLegalCard = (c: Card) => legal.some((l) => sameCard(l, c));

  const showHandPicker = phase.kind === "pick-hand" && game.chooser === HUMAN;
  const showTrumpPicker = phase.kind === "pick-trump" && game.chooser === HUMAN;
  const waitingForBot = phase.kind !== "hand-summary" && phase.kind !== "game-over"
    && !showHandPicker && !showTrumpPicker && turn !== HUMAN;

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
            isTurn={turn === p}
            total={game.totals[p]}
          />
        ))}
      </View>

      <View style={styles.opponentRow}>
        <OpponentCards count={game.playerCards[2].length} label={PLAYER_NAMES[2]} />
      </View>
      <View style={styles.middleRow}>
        <OpponentCards count={game.playerCards[1].length} label={PLAYER_NAMES[1]} vertical />
        {phase.kind === "play" && (
          <TrickArea
            trick={phase.currentTrick}
            trump={phase.trump ? SUIT_NAME[phase.trump] : undefined}
          />
        )}
        <OpponentCards count={game.playerCards[3].length} label={PLAYER_NAMES[3]} vertical />
      </View>

      {waitingForBot && (
        <Text style={styles.waiting}>
          {phase.kind === "pick-hand"
            ? `${PLAYER_NAMES[game.chooser]} el seçiyor…`
            : phase.kind === "pick-trump"
              ? `${PLAYER_NAMES[game.chooser]} koz seçiyor…`
              : turn !== null
                ? `${PLAYER_NAMES[turn]} oynuyor…`
                : ""}
        </Text>
      )}

      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>Sen</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.handScroll}
        >
          {sortHand(humanHand).map((card) => {
            const legalNow = turn === HUMAN && isLegalCard(card);
            return (
              <View key={`${card.rank}${card.suit}`} style={styles.cardWrap}>
                <PlayingCard
                  card={card}
                  size="md"
                  disabled={turn !== HUMAN || !legalNow}
                  onPress={legalNow ? () => playCard(card) : undefined}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      <HandPickerModal
        visible={showHandPicker}
        options={game.options.handTypes}
        remainingIds={game.remainingHandTypeIds}
        chooserName="Sen"
        onPick={pickHand}
      />

      <TrumpPickerModal
        visible={showTrumpPicker}
        chooserName="Sen"
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

function OpponentCards({
  count,
  label,
  vertical,
}: {
  count: number;
  label: string;
  vertical?: boolean;
}) {
  return (
    <View style={[styles.opponent, vertical && styles.opponentVertical]}>
      <View style={[styles.opponentStack, vertical && styles.opponentStackVertical]}>
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <View
            key={i}
            style={[
              styles.opponentCard,
              vertical ? { marginTop: i === 0 ? 0 : -32 } : { marginLeft: i === 0 ? 0 : -22 },
            ]}
          >
            <CardBack size="sm" />
          </View>
        ))}
      </View>
      <Text style={styles.opponentLabel}>
        {label} · {count}
      </Text>
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
  opponentRow: { alignItems: "center", marginTop: 4 },
  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  opponent: { alignItems: "center", gap: 4 },
  opponentVertical: { flex: 0 },
  opponentStack: { flexDirection: "row" },
  opponentStackVertical: { flexDirection: "column" },
  opponentCard: {},
  opponentLabel: { color: "#a8c5b6", fontSize: 11 },
  waiting: {
    color: "#d4af37",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
  },
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
