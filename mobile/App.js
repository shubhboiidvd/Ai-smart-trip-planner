import React, { useEffect } from "react";
import { Text } from "react-native";
import { registerRootComponent } from "expo";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Provider, useDispatch, useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { store } from "./src/state/store";
import { loadUserFromStorage } from "./src/features/auth/authSlice";
import {
  hydrateOffline,
  setOffline,
} from "./src/features/offline/offlineSlice";
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CreateTripScreen from "./src/screens/CreateTripScreen";
import TripDetailScreen from "./src/screens/TripDetailScreen";
const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#D46B45",
        tabBarStyle: {
          height: 74,
          paddingBottom: 12,
          paddingTop: 8,
          backgroundColor: "#FFFDF9",
        },
      }}
    >
      <Tabs.Screen
        name="Trips"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>◉</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="Plan"
        component={CreateTripScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>＋</Text>
          ),
        }}
      />
    </Tabs.Navigator>
  );
}
function Root() {
  const dispatch = useDispatch();
  const authenticated = useSelector((state) => state.auth.isAuthenticated);
  useEffect(() => {
    dispatch(loadUserFromStorage());
    dispatch(hydrateOffline());
    const unsubscribe = NetInfo.addEventListener((state) =>
      dispatch(setOffline(!state.isConnected)),
    );
    return unsubscribe;
  }, [dispatch]);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authenticated ?
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TripDetail" component={TripDetailScreen} />
          </>
        : <Stack.Screen name="Auth" component={AuthScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
function App() {
  return (
    <Provider store={store}>
      <Root />
    </Provider>
  );
}

registerRootComponent(App);
