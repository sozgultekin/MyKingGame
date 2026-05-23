import type { PlayerId, Trick } from "@mykinggame/game-core";
import { StyleSheet, Text, View } from "react-native";
import { PlayingCard } from "./Card";

const SEAT_POSITION: Record<PlayerId, { top: number; left: number }> = {
  0: { top: 110, left: 60 },
  1: { top: 60, left: 10 },
  2: { top: 10, left: 60 },
  3: { top: 60, left: 110 },
};

export interface TrickAreaProps {
  trick: Trick;
  trump?: string;
}

export function TrickArea({ trick, trump }: TrickAreaProps) {
  return (
    <View style={styles.area}>
      {trick.plays.map(({ player, card }) => {
        const pos = SEAT_POSITION[player];
        return (
          <View key={`${card.rank}${card.suit}`} style={[styles.slot, pos]}>
            <PlayingCard card={card} size="sm" />
          </View>
        );
      })}
      {trump && (
        <View style={styles.trumpBadge}>
          <Text style={styles.trumpText}>Koz: {trump}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    width: 200,
    height: 200,
    backgroundColor: "#0a3023",
    borderRadius: 100,
    borderColor: "#1d5c46",
    borderWidth: 1,
    alignSelf: "center",
    position: "relative",
  },
  slot: { position: "absolute" },
  trumpBadge: {
    position: "absolute",
    bottom: -28,
    alignSelf: "center",
    backgroundColor: "#d4af37",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trumpText: { color: "#0b3d2e", fontSize: 12, fontWeight: "700" },
});
