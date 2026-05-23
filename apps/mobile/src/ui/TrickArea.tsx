import type { PlayerId, TrickPlay } from "@mykinggame/game-core";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { PlayingCard } from "./Card";

const SEAT_POSITION: Record<PlayerId, { top: number; left: number }> = {
  0: { top: 120, left: 72 },
  1: { top: 70, left: 14 },
  2: { top: 14, left: 72 },
  3: { top: 70, left: 130 },
};

export interface TrickAreaProps {
  plays: readonly TrickPlay[];
  trump?: string;
  winner?: PlayerId;
}

export function TrickArea({ plays, trump, winner }: TrickAreaProps) {
  return (
    <View style={styles.area}>
      {plays.map(({ player, card }) => {
        const pos = SEAT_POSITION[player];
        const isWinner = winner === player;
        return (
          <Animated.View
            key={`${card.rank}${card.suit}`}
            entering={ZoomIn.duration(180)}
            style={[styles.slot, pos, isWinner && styles.winnerSlot]}
          >
            <PlayingCard card={card} size="sm" />
            {isWinner && <View style={styles.winnerGlow} />}
          </Animated.View>
        );
      })}
      {trump && (
        <Animated.View entering={FadeIn} style={styles.trumpBadge}>
          <Text style={styles.trumpText}>Koz: {trump}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    width: 220,
    height: 220,
    backgroundColor: "#0a3023",
    borderRadius: 110,
    borderColor: "#1d5c46",
    borderWidth: 1,
    alignSelf: "center",
    position: "relative",
  },
  slot: { position: "absolute" },
  winnerSlot: {
    transform: [{ scale: 1.12 }],
    shadowColor: "#d4af37",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  winnerGlow: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 8,
    borderColor: "#d4af37",
    borderWidth: 2,
  },
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
