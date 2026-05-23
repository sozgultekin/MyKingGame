import type { PlayerId, Scores } from "@mykinggame/game-core";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PLAYER_NAMES } from "./PlayerSeat";

export interface HandSummaryModalProps {
  visible: boolean;
  handName: string;
  scores: Scores;
  totals: Scores;
  isFinal: boolean;
  onAdvance: () => void;
  onNewGame: () => void;
}

export function HandSummaryModal({
  visible,
  handName,
  scores,
  totals,
  isFinal,
  onAdvance,
  onNewGame,
}: HandSummaryModalProps) {
  const players: PlayerId[] = [0, 1, 2, 3];
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{isFinal ? "Oyun Bitti" : handName}</Text>
          <Text style={styles.subtitle}>{isFinal ? "Toplam puanlar" : "Bu el puanları"}</Text>

          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.cell, styles.headCell]}>Oyuncu</Text>
              <Text style={[styles.cell, styles.headCell]}>Bu El</Text>
              <Text style={[styles.cell, styles.headCell]}>Toplam</Text>
            </View>
            {players.map((p) => (
              <View key={p} style={styles.tableRow}>
                <Text style={styles.cell}>{PLAYER_NAMES[p]}</Text>
                <Text style={[styles.cell, scores[p] < 0 && styles.neg]}>
                  {scores[p]}
                </Text>
                <Text style={[styles.cell, totals[p] < 0 && styles.neg]}>
                  {totals[p]}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={isFinal ? onNewGame : onAdvance}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <Text style={styles.btnLabel}>{isFinal ? "Yeni Oyun" : "Sonraki El"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    backgroundColor: "#0b3d2e",
    borderColor: "#d4af37",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  title: { color: "#f5e9c8", fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: {
    color: "#a8c5b6",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  table: { borderColor: "#1d5c46", borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  tableHead: { flexDirection: "row", backgroundColor: "#143b2c" },
  tableRow: {
    flexDirection: "row",
    borderTopColor: "#1d5c46",
    borderTopWidth: 1,
  },
  cell: {
    flex: 1,
    color: "#f5e9c8",
    paddingVertical: 10,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  headCell: { color: "#d4af37", fontWeight: "700", fontSize: 12 },
  neg: { color: "#e57373" },
  btn: {
    marginTop: 16,
    backgroundColor: "#d4af37",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPressed: { opacity: 0.8 },
  btnLabel: { color: "#0b3d2e", fontWeight: "700", fontSize: 16 },
});
