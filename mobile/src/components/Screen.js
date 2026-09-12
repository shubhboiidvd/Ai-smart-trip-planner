import { View, Text, StyleSheet } from "react-native";
export function Screen({ children, title, subtitle }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>TRIPSAGE</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ?
          <Text style={styles.subtitle}>{subtitle}</Text>
        : null}
      </View>
      {children}
    </View>
  );
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F4EE", paddingHorizontal: 20 },
  header: { paddingTop: 20, paddingBottom: 18 },
  kicker: {
    color: "#D46B45",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 11,
  },
  title: { color: "#14251D", fontSize: 32, fontWeight: "800", marginTop: 5 },
  subtitle: { color: "#68756D", marginTop: 6, fontSize: 15, lineHeight: 21 },
});
