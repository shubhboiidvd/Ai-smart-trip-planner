import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useDispatch, useSelector } from "react-redux";
import { useGetTripByIdQuery } from "../features/trips/tripsApiSlice";
import {
  addCustomItem,
  regenerateItinerary,
  setCurrentTrip,
  toggleChecklistItem,
} from "../features/trips/tripSlice";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
export default function TripDetailScreen({ route }) {
  const id = route.params.id;
  const dispatch = useDispatch();
  const offline = useSelector((state) => state.offline.isOffline);
  const { data, isLoading } = useGetTripByIdQuery(id, {
    skip: !!route.params.trip,
  });
  const trip = route.params.trip || data;
  const current = useSelector((state) => state.trip.currentTrip);
  const [tab, setTab] = useState("packing");
  const [day, setDay] = useState(1);
  const [photos, setPhotos] = useState([]);
  if (isLoading || !trip)
    return (
      <Screen title="Loading plan…">
        <Text style={styles.loading}>Gathering your trip details.</Text>
      </Screen>
    );
  const packing =
    current?._id === trip._id ? current.packingList : trip.packingList;
  const itinerary =
    current?._id === trip._id ? current.itinerary : trip.itinerary;
  const selectedDay =
    itinerary?.find((entry) => entry.dayNumber === day) || itinerary?.[0];
  const checked = packing?.filter((item) => item.isChecked).length || 0;
  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
  };
  const share = async () => {
    const html = `<h1>${trip.destination}</h1>${itinerary.map((entry) => `<h2>Day ${entry.dayNumber}</h2>${entry.activities.map((activity) => `<p><b>${activity.time}: ${activity.title}</b><br/>${activity.description}</p>`).join("")}`).join("")}`;
    const file = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
  };
  return (
    <Screen
      title={trip.destination}
      subtitle={`${trip.startDate} → ${trip.endDate} · ${trip.tripTypes.join(" / ")}`}
    >
      <View style={styles.actions}>
        <Button title="Share PDF" secondary onPress={share} />
        <Button title="Add photo" secondary onPress={addPhoto} />
      </View>
      {photos.length > 0 && (
        <ScrollView horizontal style={styles.gallery}>
          {photos.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photo} />
          ))}
        </ScrollView>
      )}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab("packing")}
          style={[styles.tab, tab === "packing" && styles.tabActive]}
        >
          <Text style={styles.tabText}>
            Packing · {checked}/{packing.length}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("itinerary")}
          style={[styles.tab, tab === "itinerary" && styles.tabActive]}
        >
          <Text style={styles.tabText}>Itinerary</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === "packing" ?
          <Packing packing={packing} tripId={trip._id} dispatch={dispatch} />
        : <Itinerary
            itinerary={itinerary}
            selectedDay={selectedDay}
            day={day}
            setDay={setDay}
            tripId={trip._id}
            dispatch={dispatch}
            offline={offline}
          />
        }
      </ScrollView>
    </Screen>
  );
}
function Packing({ packing, tripId, dispatch }) {
  const grouped = packing.reduce(
    (all, item) => ({
      ...all,
      [item.category]: [...(all[item.category] || []), item],
    }),
    {},
  );
  return (
    <>
      {Object.entries(grouped).map(([category, items]) => (
        <View key={category}>
          <Text style={styles.category}>{category}</Text>
          {items.map((item) => (
            <Pressable
              key={item._id}
              style={styles.item}
              onPress={() =>
                dispatch(
                  toggleChecklistItem({
                    tripId,
                    itemId: item._id,
                    isChecked: !item.isChecked,
                  }),
                )
              }
            >
              <Text style={[styles.checkbox, item.isChecked && styles.checked]}>
                {item.isChecked ? "✓" : ""}
              </Text>
              <Text style={[styles.itemText, item.isChecked && styles.strike]}>
                {item.name}
              </Text>
              {item.isWeatherSpecific && <Text>☼</Text>}
            </Pressable>
          ))}
        </View>
      ))}
    </>
  );
}
function Itinerary({
  itinerary,
  selectedDay,
  day,
  setDay,
  tripId,
  dispatch,
  offline,
}) {
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.days}
      >
        {itinerary.map((entry) => (
          <Pressable
            key={entry.dayNumber}
            onPress={() => setDay(entry.dayNumber)}
            style={[styles.day, day === entry.dayNumber && styles.dayActive]}
          >
            <Text
              style={[
                styles.dayText,
                day === entry.dayNumber && styles.dayTextActive,
              ]}
            >
              DAY {entry.dayNumber}
            </Text>
            <Text
              style={[
                styles.date,
                day === entry.dayNumber && styles.dayTextActive,
              ]}
            >
              {entry.date}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.weather}>
        <Text style={styles.weatherLabel}>FORECAST</Text>
        <Text style={styles.weatherText}>{selectedDay?.weatherForecast}</Text>
      </View>
      {selectedDay?.activities.map((activity) => (
        <View
          key={`${activity.time}-${activity.title}`}
          style={styles.activity}
        >
          <Text style={styles.time}>{activity.time}</Text>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.description}>{activity.description}</Text>
        </View>
      ))}
      <Button
        title={offline ? "Reconnect to regenerate" : "Regenerate this day"}
        secondary
        onPress={() =>
          !offline && dispatch(regenerateItinerary({ tripId, dayNumber: day }))
        }
      />
    </>
  );
}
const styles = StyleSheet.create({
  loading: { color: "#68756D" },
  actions: { flexDirection: "row", gap: 10 },
  gallery: { marginVertical: 14 },
  photo: { width: 92, height: 92, borderRadius: 12, marginRight: 8 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E6DED3",
    marginTop: 18,
  },
  tab: { paddingVertical: 14, marginRight: 22 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: "#D46B45" },
  tabText: { color: "#14251D", fontWeight: "800" },
  content: { paddingVertical: 18, gap: 12, paddingBottom: 40 },
  category: {
    color: "#D46B45",
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  item: {
    backgroundColor: "#FFFDF9",
    borderRadius: 14,
    padding: 15,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#D8D0C4",
    textAlign: "center",
    color: "#FFF",
    backgroundColor: "#FFFDF9",
  },
  checked: { backgroundColor: "#D46B45", borderColor: "#D46B45" },
  itemText: { color: "#14251D", fontSize: 16, flex: 1 },
  strike: { textDecorationLine: "line-through", color: "#9CA39D" },
  days: { marginBottom: 14 },
  day: {
    padding: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "#E8E2D7",
  },
  dayActive: { backgroundColor: "#14251D" },
  dayText: { fontSize: 11, fontWeight: "800", color: "#68756D" },
  date: { fontSize: 12, color: "#68756D", marginTop: 4 },
  dayTextActive: { color: "#FFFDF9" },
  weather: { backgroundColor: "#DDE7DE", padding: 16, borderRadius: 14 },
  weatherLabel: {
    color: "#68756D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  weatherText: { color: "#14251D", fontWeight: "700", marginTop: 5 },
  activity: {
    borderLeftWidth: 2,
    borderLeftColor: "#D46B45",
    paddingLeft: 15,
    paddingVertical: 4,
  },
  time: { color: "#D46B45", fontWeight: "800", fontSize: 12 },
  activityTitle: {
    color: "#14251D",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 3,
  },
  description: { color: "#68756D", lineHeight: 20, marginTop: 4 },
});
