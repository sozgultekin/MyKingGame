import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export interface PrivacyCurtainProps {
  visible: boolean;
  playerName: string;
  onReveal: () => void;
}

export function PrivacyCurtain({ visible, playerName, onReveal }: PrivacyCurtainProps) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.curtain}>
      <View style={styles.inner}>
        <Text style={styles.label}>Sıra</Text>
        <Text style={styles.name}>{playerName}</Text>
        <Text style={styles.hint}>
          Telefonu {playerName}'e ver. Kartlarını başkası görmesin.
        </Text>
        <Pressable
          onPress={onReveal}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.btnLabel}>Kartlarımı Göster</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  curtain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#062019",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  inner: { alignItems: "center", padding: 32, gap: 8 },
  label: { color: "#a8c5b6", fontSize: 16, letterSpacing: 2 },
  name: { color: "#d4af37", fontSize: 40, fontWeight: "800" },
  hint: {
    color: "#a8c5b6",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 16,
    maxWidth: 280,
  },
  btn: {
    backgroundColor: "#d4af37",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  btnLabel: { color: "#0b3d2e", fontSize: 18, fontWeight: "700" },
});
