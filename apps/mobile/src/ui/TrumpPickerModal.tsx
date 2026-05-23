import type { Suit } from "@mykinggame/game-core";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const SUITS: { id: Suit; glyph: string; color: string; name: string }[] = [
  { id: "C", glyph: "♣", color: "#1a1a1a", name: "Sinek" },
  { id: "D", glyph: "♦", color: "#c62828", name: "Karo" },
  { id: "H", glyph: "♥", color: "#c62828", name: "Kupa" },
  { id: "S", glyph: "♠", color: "#1a1a1a", name: "Maça" },
];

export interface TrumpPickerModalProps {
  visible: boolean;
  chooserName: string;
  onPick: (suit: Suit) => void;
}

export function TrumpPickerModal({ visible, chooserName, onPick }: TrumpPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{chooserName} — Koz Seç</Text>
          <View style={styles.row}>
            {SUITS.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => onPick(s.id)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <Text style={[styles.glyph, { color: s.color }]}>{s.glyph}</Text>
                <Text style={styles.tileName}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
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
  title: { color: "#f5e9c8", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  tile: {
    flex: 1,
    backgroundColor: "#fbf6e6",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  pressed: { opacity: 0.7 },
  glyph: { fontSize: 36, fontWeight: "700" },
  tileName: { color: "#1a1a1a", marginTop: 4, fontSize: 12, fontWeight: "600" },
});
