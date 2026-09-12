import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { login, register } from "../features/auth/authSlice";
import { Button } from "../components/Button";
export default function AuthScreen() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View>
        <Text style={styles.mark}>TRIPSAGE</Text>
        <Text style={styles.title}>Pack lighter.{"\n"}Travel deeper.</Text>
        <Text style={styles.body}>
          A calm, clever co-pilot for the details between departure and
          discovery.
        </Text>
        <View style={styles.form}>
          {mode === "register" && (
            <TextInput
              placeholder="Your name"
              value={form.name}
              onChangeText={(v) => update("name", v)}
              style={styles.input}
            />
          )}
          <TextInput
            placeholder="Email address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(v) => update("email", v)}
            style={styles.input}
          />
          <TextInput
            placeholder="Password (8+ characters)"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => update("password", v)}
            style={styles.input}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button
            title={mode === "login" ? "Sign in" : "Create account"}
            loading={status === "loading"}
            onPress={() =>
              dispatch(mode === "login" ? login(form) : register(form))
            }
          />
        </View>
        <Pressable
          onPress={() => setMode(mode === "login" ? "register" : "login")}
        >
          <Text style={styles.switch}>
            {mode === "login" ?
              "New here? Create an account"
            : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F7F4EE",
  },
  mark: { color: "#D46B45", fontWeight: "800", letterSpacing: 3, fontSize: 12 },
  title: {
    color: "#14251D",
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 45,
    marginTop: 18,
  },
  body: {
    color: "#68756D",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    maxWidth: 320,
  },
  form: { gap: 12, marginTop: 30 },
  input: {
    backgroundColor: "#FFFDF9",
    borderWidth: 1,
    borderColor: "#E6DED3",
    padding: 17,
    borderRadius: 14,
    fontSize: 16,
  },
  error: { color: "#B44739" },
  switch: {
    color: "#D46B45",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 20,
  },
});
