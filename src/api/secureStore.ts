import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const TOKEN_KEY = "pr_authToken";
const USER_KEY = "pr_userData";

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
    await SecureStore.setItemAsync(TOKEN_KEY, token as string);
    console.log("🔐 Auth token saved successfully");
  } catch (err) {
    console.error("SECURE_STORE_SAVE_ERROR:", err);
  }
};

/**
 * Retrieves the stored authentication token.
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      console.log("🔑 No auth token found in secure store");
      return null;
    }
    return token;
  } catch (err) {
    console.error("SECURE_STORE_GET_ERROR:", err);
    return null;
  }
};

/* ====================== USER DATA FUNCTIONS ====================== */

/**
 * Save user profile data to secure storage.
 */
export const saveUser = async (user: any): Promise<void> => {
  try {
    if (!user || !user._id) {
      console.warn("⚠️ Invalid user data passed to saveUser");
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    console.log("👤 User data saved successfully:", {
      id: user._id || user?.id,
      fullName: user.fullName || user.name,
      email: user.email,
    });
  } catch (err) {
    console.error("SECURE_STORE_USER_SAVE_ERROR:", err);
  }
};

/**
 * Retrieve user profile from secure storage.
 */
export const getUser = async (): Promise<any | null> => {
  try {
    const userString = await SecureStore.getItemAsync(USER_KEY);
    if (!userString) {
      console.log("🔑 No user data found in secure store");
      return null;
    }

    const user = JSON.parse(userString);
    console.log("👤 User retrieved from secure store:", user.fullName || user.name);
    return user;
  } catch (err) {
    console.error("SECURE_STORE_USER_GET_ERROR:", err);
    return null;
  }
};

/**
 * Remove only user data.
 */
export const removeUser = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
    console.log("🗑️ User data removed from secure storage");
  } catch (err) {
    console.error("SECURE_STORE_USER_DELETE_ERROR:", err);
  }
};

/**
 * Clears hardware secure layers, async storage cache, and updates routing.
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY), // Also clear user data
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
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      AsyncStorage.clear(),
    ]);
    console.log("🧹 All authentication data cleared successfully");
  } catch (err) {
    console.error("CLEAR_AUTH_DATA_ERROR:", err);
  }
};