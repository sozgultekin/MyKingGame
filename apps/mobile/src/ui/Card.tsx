import { type Card as GameCard, type Suit } from "@mykinggame/game-core";
import { Pressable, StyleSheet, Text, View } from "react-native";

const SUIT_GLYPH: Record<Suit, string> = { C: "♣", D: "♦", H: "♥", S: "♠" };
const SUIT_COLOR: Record<Suit, string> = {
  C: "#1a1a1a",
  D: "#c62828",
  H: "#c62828",
  S: "#1a1a1a",
};

export interface PlayingCardProps {
  card: GameCard;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  selected?: boolean;
  onPress?: () => void;
}

export function PlayingCard({
  card,
  size = "md",
  disabled = false,
  selected = false,
  onPress,
}: PlayingCardProps) {
  const dims = SIZES[size];
  const color = SUIT_COLOR[card.suit];
  const content = (
    <View
      style={[
        styles.card,
        { width: dims.w, height: dims.h, borderRadius: dims.radius },
        disabled && styles.disabled,
        selected && styles.selected,
      ]}
    >
      <Text style={[styles.cornerTop, { color, fontSize: dims.corner }]}>
        {card.rank}
        {"\n"}
        {SUIT_GLYPH[card.suit]}
      </Text>
      <Text style={[styles.center, { color, fontSize: dims.center }]}>
        {SUIT_GLYPH[card.suit]}
      </Text>
      <Text style={[styles.cornerBottom, { color, fontSize: dims.corner }]}>
        {card.rank}
        {"\n"}
        {SUIT_GLYPH[card.suit]}
      </Text>
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={4}>
      {content}
    </Pressable>
  );
}

const SIZES = {
  sm: { w: 36, h: 52, radius: 4, corner: 10, center: 18 },
  md: { w: 56, h: 80, radius: 6, corner: 14, center: 28 },
  lg: { w: 72, h: 104, radius: 8, corner: 18, center: 36 },
} as const;

export function CardBack({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = SIZES[size];
  return (
    <View
      style={[
        styles.card,
        styles.back,
        { width: dims.w, height: dims.h, borderRadius: dims.radius },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fbf6e6",
    borderColor: "#2b2b2b",
    borderWidth: 1,
    padding: 4,
    position: "relative",
  },
  back: { backgroundColor: "#1d5c46", borderColor: "#d4af37" },
  disabled: { opacity: 0.45 },
  selected: { borderColor: "#d4af37", borderWidth: 2, transform: [{ translateY: -10 }] },
  cornerTop: { position: "absolute", top: 3, left: 4, fontWeight: "700", lineHeight: 12 },
  cornerBottom: {
    position: "absolute",
    bottom: 3,
    right: 4,
    fontWeight: "700",
    lineHeight: 12,
    transform: [{ rotate: "180deg" }],
  },
  center: { alignSelf: "center", fontWeight: "700" },
});
