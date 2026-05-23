import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>King</Text>
      <Text style={styles.subtitle}>Klasik 10 El</Text>

      <View style={styles.menu}>
        <ModeButton href="/single" label="Tek Kişilik" hint="3 boto karşı" />
        <ModeButton href="/local" label="Yerel Oyun" hint="Aynı cihazda 4 kişi" />
        <ModeButton href="/online" label="Online" hint="Oda kodu ile" />
      </View>

      <Text style={styles.footer}>v0.0.1 · iOS · Android</Text>
    </View>
  );
}

function ModeButton({
  href,
  label,
  hint,
}: {
  href: "/single" | "/local" | "/online";
  label: string;
  hint: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
        <Text style={styles.btnLabel}>{label}</Text>
        <Text style={styles.btnHint}>{hint}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b3d2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 24,
  },
  title: {
    color: "#f5e9c8",
    fontSize: 64,
    fontWeight: "800",
    letterSpacing: 4,
  },
  subtitle: { color: "#d4af37", fontSize: 18, marginBottom: 24 },
  menu: { width: "100%", maxWidth: 360, gap: 12 },
  btn: {
    backgroundColor: "#1d5c46",
    borderColor: "#d4af37",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  btnPressed: { opacity: 0.8 },
  btnLabel: { color: "#f5e9c8", fontSize: 20, fontWeight: "600" },
  btnHint: { color: "#a8c5b6", fontSize: 13, marginTop: 4 },
  footer: { color: "#5d7e6f", fontSize: 12, marginTop: 16 },
});
