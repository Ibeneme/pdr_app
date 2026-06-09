import React from "react";
import OnboardingScreen from "./(auth)/Onboarding";

/**
 * Expo Router targets this index file as your root entry page route.
 * We instantly render the Onboarding component file right out of your auth folder group.
 */
export default function AppEntryIndex() {
  return <OnboardingScreen />;
}
