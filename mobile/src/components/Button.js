import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";
export function Button({ title, onPress, loading, secondary }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && styles.pressed,
      ]}
    >
      {loading ?
        <ActivityIndicator color={secondary ? "#14251D" : "#FFF"} />
      : <Text style={[styles.label, secondary && styles.secondaryLabel]}>
          {title}
        </Text>
      }
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: "#D46B45",
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondary: { backgroundColor: "#E8E2D7" },
  label: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  secondaryLabel: { color: "#14251D" },
  pressed: { opacity: 0.8 },
});
