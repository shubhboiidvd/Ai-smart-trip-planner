import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { createTrip } from "../features/trips/tripSlice";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
const types = ["Business", "Beach", "Hiking", "City Break", "Camping"];
export default function CreateTripScreen({ navigation }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.trip);
  const offline = useSelector((state) => state.offline.isOffline);
  const [form, setForm] = useState({
    destination: "",
    startDate: new Date().toISOString().slice(0, 10),
    tripLength: "4",
    tripTypes: ["City Break"],
    provider: "openai",
  });
  const toggle = (type) =>
    setForm((current) => ({
      ...current,
      tripTypes:
        current.tripTypes.includes(type) ?
          current.tripTypes.filter((value) => value !== type)
        : [...current.tripTypes, type],
    }));
  const submit = async () => {
    if (offline)
      return Alert.alert(
        "You are offline",
        "Reconnect before generating a new AI plan.",
      );
    if (!form.destination || !form.tripTypes.length)
      return Alert.alert(
        "Almost ready",
        "Add a destination and choose at least one trip style.",
      );
    const result = await dispatch(
      createTrip({ ...form, tripLength: Number(form.tripLength) }),
    );
    if (createTrip.fulfilled.match(result))
      navigation.navigate("TripDetail", {
        id: result.payload._id,
        trip: result.payload,
      });
  };
  return (
    <Screen
      title="Plan a getaway"
      subtitle="Tell us the shape of the trip. We will handle the small stuff."
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>DESTINATION</Text>
        <TextInput
          placeholder="Lisbon, Portugal"
          value={form.destination}
          onChangeText={(v) => setForm({ ...form, destination: v })}
          style={styles.input}
        />
        <View style={styles.split}>
          <View style={styles.half}>
            <Text style={styles.label}>START DATE</Text>
            <TextInput
              value={form.startDate}
              onChangeText={(v) => setForm({ ...form, startDate: v })}
              style={styles.input}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>DAYS</Text>
            <TextInput
              keyboardType="number-pad"
              value={form.tripLength}
              onChangeText={(v) => setForm({ ...form, tripLength: v })}
              style={styles.input}
            />
          </View>
        </View>
        <Text style={styles.label}>TRIP MOOD</Text>
        <View style={styles.chips}>
          {types.map((type) => (
            <Pressable
              key={type}
              onPress={() => toggle(type)}
              style={[
                styles.chip,
                form.tripTypes.includes(type) && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  form.tripTypes.includes(type) && styles.chipTextActive,
                ]}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>AI GUIDE</Text>
        <View style={styles.chips}>
          {["openai", "anthropic", "gemini"].map((provider) => (
            <Pressable
              key={provider}
              onPress={() => setForm({ ...form, provider })}
              style={[
                styles.chip,
                form.provider === provider && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  form.provider === provider && styles.chipTextActive,
                ]}
              >
                {provider}
              </Text>
            </Pressable>
          ))}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          title={
            status === "loading" ? "Mapping your days…" : "Generate trip plan"
          }
          loading={status === "loading"}
          onPress={submit}
        />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 12 },
  label: {
    color: "#68756D",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#FFFDF9",
    borderWidth: 1,
    borderColor: "#E6DED3",
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    color: "#14251D",
  },
  split: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D8D0C4",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
  },
  chipActive: { backgroundColor: "#14251D", borderColor: "#14251D" },
  chipText: { color: "#68756D", fontWeight: "700" },
  chipTextActive: { color: "#FFFDF9" },
  error: { color: "#B44739" },
});
