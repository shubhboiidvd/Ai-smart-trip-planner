import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetTripsQuery,
  useDeleteTripMutation,
} from "../features/trips/tripsApiSlice";
import { logout } from "../features/auth/authSlice";
import { Screen } from "../components/Screen";
export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { data = [], isLoading, refetch } = useGetTripsQuery();
  const cached = useSelector((state) => state.offline.cachedTrips);
  const offline = useSelector((state) => state.offline.isOffline);
  const [deleteTrip] = useDeleteTripMutation();
  const trips = data.length ? data : cached;
  return (
    <Screen
      title="Your journeys"
      subtitle={
        offline ?
          "Offline mode · showing saved trips"
        : "Your next good idea is probably a trip."
      }
    >
      <View style={styles.row}>
        <Text style={styles.count}>
          {trips.length} saved {trips.length === 1 ? "trip" : "trips"}
        </Text>
        <Pressable onPress={() => dispatch(logout())}>
          <Text style={styles.logout}>Sign out</Text>
        </Pressable>
      </View>
      <FlatList
        data={trips}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#D46B45"
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>A blank map is a good start.</Text>
            <Text style={styles.emptyCopy}>
              Create a plan and we will turn the details into momentum.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("TripDetail", { id: item._id })}
            style={styles.card}
          >
            <View>
              <Text style={styles.destination}>{item.destination}</Text>
              <Text style={styles.meta}>
                {item.startDate} · {item.tripTypes?.join(" / ")}
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: { color: "#68756D", fontWeight: "700" },
  logout: { color: "#D46B45", fontWeight: "800" },
  list: { paddingVertical: 20, gap: 12 },
  card: {
    backgroundColor: "#FFFDF9",
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6DED3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  destination: { color: "#14251D", fontSize: 21, fontWeight: "800" },
  meta: { color: "#68756D", marginTop: 8 },
  arrow: { color: "#D46B45", fontSize: 25 },
  empty: { paddingTop: 80, alignItems: "center" },
  emptyTitle: { color: "#14251D", fontSize: 20, fontWeight: "800" },
  emptyCopy: { color: "#68756D", textAlign: "center", marginTop: 8 },
});
