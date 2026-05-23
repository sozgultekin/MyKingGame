import {
  type Card,
  type PlayerId,
  legalPlays,
  sameCard,
} from "@mykinggame/game-core";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CardBack, PlayingCard } from "../src/ui/Card";
import { HandPickerModal } from "../src/ui/HandPickerModal";
import { HandSummaryModal } from "../src/ui/HandSummaryModal";
import { PLAYER_NAMES, PlayerSeat } from "../src/ui/PlayerSeat";
import { TrickArea } from "../src/ui/TrickArea";
import { TrumpPickerModal } from "../src/ui/TrumpPickerModal";
import { useOnlineGame } from "../src/store/onlineGameStore";
import { DEFAULT_HAND_TYPES } from "@mykinggame/game-core";

const ALL_PLAYERS: PlayerId[] = [0, 1, 2, 3];
const SUIT_NAME: Record<string, string> = {
  C: "♣ Sinek",
  D: "♦ Karo",
  H: "♥ Kupa",
  S: "♠ Maça",
};

export default function OnlineScreen() {
  const status = useOnlineGame((s) => s.status);
  const error = useOnlineGame((s) => s.error);

  if (status === "idle" || status === "error") return <LobbyForm error={error} />;
  if (status === "connecting") return <Connecting />;
  if (status === "lobby") return <LobbyRoom />;
  return <OnlineGameView />;
}

function LobbyForm({ error }: { error: string | null }) {
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const createRoom = useOnlineGame((s) => s.createRoom);
  const joinRoom = useOnlineGame((s) => s.joinRoom);

  const name = displayName.trim() || "Oyuncu";
  const canJoin = joinCode.trim().length >= 4;

  return (
    <View style={styles.formRoot}>
      <Text style={styles.title}>Online King</Text>
      <Text style={styles.body}>
        Bir oda oluştur ve kodu paylaş, ya da arkadaşının kodu ile katıl.
        Eksik koltuklar bot ile doldurulur.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Görünen ad</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Adın"
          placeholderTextColor="#5d7e6f"
          maxLength={20}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.7 }]}
        onPress={() => createRoom(name)}
      >
        <Text style={styles.primaryBtnLabel}>Oda Oluştur</Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>veya</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Oda Kodu</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.toUpperCase())}
          placeholder="ABCDE"
          placeholderTextColor="#5d7e6f"
          autoCapitalize="characters"
          maxLength={6}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.secondaryBtn,
          !canJoin && styles.disabledBtn,
          pressed && canJoin && { opacity: 0.7 },
        ]}
        disabled={!canJoin}
        onPress={() => joinRoom(joinCode, name)}
      >
        <Text style={styles.secondaryBtnLabel}>Odaya Katıl</Text>
      </Pressable>

      {error && <Text style={styles.errorText}>⚠ {error}</Text>}

      <Link href="/" asChild>
        <Pressable style={styles.linkBtn}>
          <Text style={styles.linkText}>← Ana Menü</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function Connecting() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color="#d4af37" size="large" />
      <Text style={styles.body}>Sunucuya bağlanılıyor…</Text>
    </View>
  );
}

function LobbyRoom() {
  const code = useOnlineGame((s) => s.code);
  const mySeat = useOnlineGame((s) => s.mySeat);
  const occupied = useOnlineGame((s) => s.lobbyOccupied);
  const sendReady = useOnlineGame((s) => s.sendReady);
  const leave = useOnlineGame((s) => s.leave);

  const isHost = mySeat === 0;
  const occupiedCount = occupied
    ? Object.values(occupied).filter(Boolean).length
    : 0;

  return (
    <View style={styles.formRoot}>
      <Text style={styles.title}>Oda Kodu</Text>
      <Text style={styles.codeDisplay}>{code}</Text>
      <Text style={styles.body}>
        Bu kodu arkadaşlarınla paylaş. {occupiedCount}/4 oyuncu hazır.
      </Text>

      <View style={styles.seatList}>
        {ALL_PLAYERS.map((p) => {
          const isMe = p === mySeat;
          const isFilled = occupied?.[p] ?? false;
          return (
            <View
              key={p}
              style={[
                styles.seatRow,
                isMe && styles.seatRowMe,
              ]}
            >
              <Text style={styles.seatRowText}>
                {PLAYER_NAMES[p]}
                {isMe ? " (Sen)" : ""}
              </Text>
              <Text style={styles.seatStatus}>
                {isFilled ? "✓ Hazır" : "— Boş (bot ile dolacak)"}
              </Text>
            </View>
          );
        })}
      </View>

      {isHost && (
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.7 }]}
          onPress={sendReady}
        >
          <Text style={styles.primaryBtnLabel}>Oyunu Başlat</Text>
        </Pressable>
      )}
      {!isHost && (
        <Text style={styles.waitingHost}>Host'un başlatması bekleniyor…</Text>
      )}

      <Pressable style={styles.linkBtn} onPress={leave}>
        <Text style={styles.linkText}>← Odayı Terk Et</Text>
      </Pressable>
    </View>
  );
}

function OnlineGameView() {
  const view = useOnlineGame((s) => s.view);
  const sendAction = useOnlineGame((s) => s.sendAction);
  const leave = useOnlineGame((s) => s.leave);

  const public_ = view?.publicState;
  const turn: PlayerId | null = useMemo(() => {
    if (!public_) return null;
    if (public_.phase.kind === "play") return public_.phase.turn;
    return null;
  }, [public_]);

  const handType = useMemo(() => {
    if (!public_) return undefined;
    const ph = public_.phase;
    if (
      ph.kind === "play" ||
      ph.kind === "trick-complete" ||
      ph.kind === "pick-trump" ||
      ph.kind === "hand-summary"
    ) {
      return DEFAULT_HAND_TYPES.find((h) => h.id === ph.handTypeId);
    }
    return undefined;
  }, [public_]);

  const legal = useMemo(() => {
    if (!view || !public_) return [];
    if (public_.phase.kind !== "play" || turn !== view.yourSeat) return [];
    return legalPlays(view.yourHand, public_.phase.currentTrick);
  }, [view, public_, turn]);
  const isLegalCard = (c: Card) => legal.some((l) => sameCard(l, c));

  if (!view || !public_) return <Connecting />;

  const mySeat = view.yourSeat;
  const showHandPicker = public_.phase.kind === "pick-hand" && public_.chooser === mySeat;
  const showTrumpPicker = public_.phase.kind === "pick-trump" && public_.chooser === mySeat;
  const isMyTurn = turn === mySeat;

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.handLabel}>
          {handType ? handType.name : "El seçiliyor..."}
        </Text>
        <Text style={styles.handsCount}>
          {public_.handsPlayed + 1} / {public_.totalHands}
        </Text>
      </View>

      <View style={styles.seatsRow}>
        {ALL_PLAYERS.map((p) => (
          <PlayerSeat
            key={p}
            player={p}
            isChooser={public_.chooser === p}
            isTurn={turn === p}
            total={public_.totals[p]}
          />
        ))}
      </View>

      <View style={styles.middleRow}>
        {public_.phase.kind === "play" && (
          <TrickArea
            plays={public_.phase.currentTrick.plays}
            trump={public_.phase.trump ? SUIT_NAME[public_.phase.trump] : undefined}
          />
        )}
        {public_.phase.kind === "trick-complete" && (
          <TrickArea
            plays={public_.phase.lastTrick.plays}
            trump={public_.phase.trump ? SUIT_NAME[public_.phase.trump] : undefined}
            winner={public_.phase.lastTrick.winner}
          />
        )}
      </View>

      <View style={styles.opponentCounts}>
        {ALL_PLAYERS.filter((p) => p !== mySeat).map((p) => (
          <View key={p} style={styles.opponentChip}>
            <CardBack size="sm" />
            <Text style={styles.opponentChipLabel}>
              {PLAYER_NAMES[p]}: {public_.cardCounts[p]}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>
          Sen {isMyTurn ? "— sıran" : ""}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.handScroll}
        >
          {sortHand(view.yourHand).map((card) => {
            const legalNow = isMyTurn && isLegalCard(card);
            return (
              <View key={`${card.rank}${card.suit}`} style={styles.cardWrap}>
                <PlayingCard
                  card={card}
                  size="md"
                  disabled={!legalNow}
                  onPress={
                    legalNow
                      ? () =>
                          sendAction({
                            kind: "play-card",
                            player: mySeat,
                            card,
                          })
                      : undefined
                  }
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      <HandPickerModal
        visible={showHandPicker}
        options={DEFAULT_HAND_TYPES}
        remainingIds={public_.remainingHandTypeIds}
        chooserName="Sen"
        onPick={(id) => sendAction({ kind: "pick-hand", handTypeId: id })}
      />

      <TrumpPickerModal
        visible={showTrumpPicker}
        chooserName="Sen"
        onPick={(suit) => sendAction({ kind: "pick-trump", suit })}
      />

      {public_.phase.kind === "hand-summary" && (
        <HandSummaryModal
          visible
          handName={handType?.name ?? public_.phase.handTypeId}
          scores={public_.phase.scores}
          totals={public_.totals}
          isFinal={false}
          onAdvance={() => sendAction({ kind: "advance-after-hand" })}
          onNewGame={leave}
        />
      )}

      {public_.phase.kind === "game-over" && (
        <HandSummaryModal
          visible
          handName="Final"
          scores={public_.scoreSheet.at(-1)?.scores ?? public_.totals}
          totals={public_.totals}
          isFinal
          onAdvance={leave}
          onNewGame={leave}
        />
      )}

      <Pressable style={styles.linkBtn} onPress={leave}>
        <Text style={styles.linkText}>← Odadan Çık</Text>
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

const styles = StyleSheet.create({
  formRoot: {
    flex: 1,
    backgroundColor: "#0b3d2e",
    padding: 24,
    gap: 16,
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    backgroundColor: "#0b3d2e",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  root: { flex: 1, backgroundColor: "#0b3d2e", padding: 12, gap: 8 },
  title: { color: "#f5e9c8", fontSize: 28, fontWeight: "800", textAlign: "center" },
  body: { color: "#a8c5b6", fontSize: 14, textAlign: "center" },
  field: { gap: 6 },
  label: { color: "#d4af37", fontSize: 12, fontWeight: "600" },
  input: {
    backgroundColor: "#0a3023",
    borderColor: "#1d5c46",
    borderWidth: 1,
    borderRadius: 10,
    color: "#f5e9c8",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  codeInput: { textAlign: "center", letterSpacing: 4, fontSize: 22, fontWeight: "700" },
  codeDisplay: {
    color: "#d4af37",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: 8,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#d4af37",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnLabel: { color: "#0b3d2e", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "#1d5c46",
    borderColor: "#d4af37",
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnLabel: { color: "#f5e9c8", fontSize: 16, fontWeight: "600" },
  disabledBtn: { opacity: 0.4 },
  divider: { flexDirection: "row", alignItems: "center", gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1d5c46" },
  dividerText: { color: "#5d7e6f", fontSize: 12 },
  errorText: { color: "#e57373", textAlign: "center", fontSize: 13 },
  linkBtn: { alignSelf: "center", padding: 12 },
  linkText: { color: "#a8c5b6", fontSize: 13 },
  seatList: { gap: 8 },
  seatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#143b2c",
    padding: 12,
    borderRadius: 8,
  },
  seatRowMe: { borderColor: "#d4af37", borderWidth: 1 },
  seatRowText: { color: "#f5e9c8", fontWeight: "600" },
  seatStatus: { color: "#a8c5b6", fontSize: 12 },
  waitingHost: { color: "#d4af37", textAlign: "center", fontStyle: "italic" },
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
  middleRow: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  opponentCounts: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  opponentChip: { alignItems: "center", gap: 4 },
  opponentChipLabel: { color: "#a8c5b6", fontSize: 11 },
  handContainer: { gap: 8 },
  handScroll: { gap: 6, paddingVertical: 8 },
  cardWrap: { width: 56 },
});
