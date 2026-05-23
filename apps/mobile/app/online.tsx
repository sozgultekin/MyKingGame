import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function OnlineScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Online</Text>
      <Text style={styles.body}>
        Oda kodu ile online çoklu oyuncu yakında. Sunucu (Colyseus) ve lobby
        sonraki sürümde.
      </Text>
      <Link href="/" asChild>
        <Pressable style={styles.btn}>
          <Text style={styles.btnLabel}>Ana Menü</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0b3d2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  title: { color: "#f5e9c8", fontSize: 28, fontWeight: "700" },
  body: { color: "#a8c5b6", fontSize: 14, textAlign: "center", marginBottom: 16 },
  btn: {
    backgroundColor: "#1d5c46",
    borderColor: "#d4af37",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  btnLabel: { color: "#f5e9c8", fontWeight: "600" },
});
