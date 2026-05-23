import type { HandType } from "@mykinggame/game-core";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface HandPickerModalProps {
  visible: boolean;
  options: readonly HandType[];
  remainingIds: readonly string[];
  chooserName: string;
  onPick: (id: string) => void;
}

export function HandPickerModal({
  visible,
  options,
  remainingIds,
  chooserName,
  onPick,
}: HandPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{chooserName} — El Seç</Text>
          <Text style={styles.subtitle}>Kalan: {remainingIds.length} el</Text>
          <ScrollView>
            {options
              .filter((h) => remainingIds.includes(h.id))
              .map((h) => (
                <Pressable
                  key={h.id}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => onPick(h.id)}
                >
                  <Text style={styles.rowTitle}>{h.name}</Text>
                  <Text style={styles.rowDesc}>{h.description}</Text>
                </Pressable>
              ))}
          </ScrollView>
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
    maxHeight: "80%",
  },
  title: { color: "#f5e9c8", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#a8c5b6", fontSize: 13, marginTop: 4, marginBottom: 10 },
  row: {
    backgroundColor: "#143b2c",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowPressed: { backgroundColor: "#1d5c46" },
  rowTitle: { color: "#f5e9c8", fontSize: 16, fontWeight: "600" },
  rowDesc: { color: "#a8c5b6", fontSize: 12, marginTop: 4 },
});
