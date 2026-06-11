import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Platform } from "react-native";

const TOKEN_KEY = "pr_authToken";
const USER_KEY = "pr_userData";

// Check if we are running in a web environment
const isWeb = Platform.OS === "web";

/**
 * Universal helper to save items depending on the environment.
 */
const setItem = async (key: string, value: string): Promise<void> => {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

/**
 * Universal helper to get items depending on the environment.
 */
const getItem = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return await AsyncStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

/**
 * Universal helper to delete items depending on the environment.
 */
const deleteItem = async (key: string): Promise<void> => {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

/**
 * Basic presence check for a token string.
 */
export const hasToken = (token: string | null | undefined): boolean => {
  return !!token && typeof token === "string" && token.trim() !== "";
};

/**
 * Persists the raw authentication token securely.
 */
export const saveAuthToken = async (token: string | null | undefined): Promise<void> => {
  try {
    if (!hasToken(token)) {
      await removeAuthToken();
      return;
    }
    await setItem(TOKEN_KEY, token as string);
    console.log(`🔐 Auth token saved successfully (${isWeb ? "Web Storage" : "Secure Store"})`);
  } catch (err) {
    console.error("STORAGE_SAVE_ERROR:", err);
  }
};

/**
 * Retrieves the stored authentication token.
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await getItem(TOKEN_KEY);
    if (!token) {
      console.log("🔑 No auth token found in storage");
      return null;
    }
    return token;
  } catch (err) {
    console.error("STORAGE_GET_ERROR:", err);
    return null;
  }
};

/* ====================== USER DATA FUNCTIONS ====================== */

/**
 * Save user profile data to storage.
 */
export const saveUser = async (user: any): Promise<void> => {
  try {
    if (!user || !user._id) {
      console.warn("⚠️ Invalid user data passed to saveUser");
      return;
    }
    await setItem(USER_KEY, JSON.stringify(user));
    console.log(`👤 User data saved successfully (${isWeb ? "Web Storage" : "Secure Store"}):`, {
      id: user._id || user?.id,
      fullName: user.fullName || user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("STORAGE_USER_SAVE_ERROR:", err);
  }
};

/**
 * Retrieve user profile from storage.
 */
export const getUser = async (): Promise<any | null> => {
  try {
    const userString = await getItem(USER_KEY);
    if (!userString) {
      console.log("🔑 No user data found in storage");
      return null;
    }

    const user = JSON.parse(userString);
    console.log("👤 User retrieved from storage:", user.fullName || user.name);
    return user;
  } catch (err) {
    console.error("STORAGE_USER_GET_ERROR:", err);
    return null;
  }
};

/**
 * Remove only user data.
 */
export const removeUser = async (): Promise<void> => {
  try {
    await deleteItem(USER_KEY);
    console.log("🗑️ User data removed from storage");
  } catch (err) {
    console.error("STORAGE_USER_DELETE_ERROR:", err);
  }
};

/**
 * Clears hardware secure layers/local caches and updates routing.
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await Promise.allSettled([
      deleteItem(TOKEN_KEY),
      deleteItem(USER_KEY),
      AsyncStorage.clear(),
    ]);
    console.log("Full session and data caches cleared.");
  } catch (err) {
    console.error("SESSION_WIPE_ERROR:", err);
  } finally {
    router.replace("/(auth)/sign-in");
  }
};

/**
 * Clear all auth-related data (Token + User).
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await Promise.allSettled([
      deleteItem(TOKEN_KEY),
      deleteItem(USER_KEY),
      AsyncStorage.clear(),
    ]);
    console.log("🧹 All authentication data cleared successfully");
  } catch (err) {
    console.error("CLEAR_AUTH_DATA_ERROR:", err);
  }
};