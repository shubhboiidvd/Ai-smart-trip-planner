import AsyncStorage from "@react-native-async-storage/async-storage";
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
export async function request(path, options = {}) {
  const token = await AsyncStorage.getItem("token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.message || "Something went wrong");
  return data;
}
