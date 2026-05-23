import type { PlayerId } from "@mykinggame/game-core";
import { StyleSheet, Text, View } from "react-native";

export const PLAYER_NAMES: Record<PlayerId, string> = {
  0: "Güney",
  1: "Batı",
  2: "Kuzey",
  3: "Doğu",
};

export interface PlayerSeatProps {
  player: PlayerId;
  isChooser: boolean;
  isTurn: boolean;
  total?: number;
}

export function PlayerSeat({ player, isChooser, isTurn, total }: PlayerSeatProps) {
  return (
    <View
      style={[
        styles.seat,
        isTurn && styles.seatTurn,
        isChooser && styles.seatChooser,
      ]}
    >
      <Text style={styles.name}>{PLAYER_NAMES[player]}</Text>
      {total !== undefined && (
        <Text style={[styles.total, total < 0 && styles.totalNeg]}>{total}</Text>
      )}
      {isChooser && <Text style={styles.tag}>Dağıtan</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  seat: {
    backgroundColor: "#0a3023",
    borderColor: "#1d5c46",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 80,
  },
  seatTurn: { borderColor: "#d4af37", borderWidth: 2 },
  seatChooser: { backgroundColor: "#143b2c" },
  name: { color: "#f5e9c8", fontSize: 13, fontWeight: "600" },
  total: { color: "#a8c5b6", fontSize: 18, fontWeight: "700", marginTop: 2 },
  totalNeg: { color: "#e57373" },
  tag: { color: "#d4af37", fontSize: 10, marginTop: 2 },
});
