// ------------------------------------------------------------------
// PairingComponents.tsx — "Waybill" design language
//
// Design direction: this screen is fundamentally a shipping manifest —
// a tracking ID, a route, a status. Instead of a soft dating-app card
// stack, the hero reads like a ticket stub: a perforated divider with
// punched notches separates the ID block from the route timeline, data
// fields use a monospace "manifest" type face, and the palette moves
// from violet/indigo to an ink-navy + cargo-teal + amber-flag system —
// the amber only appears on the one call-to-action gradient, so it
// reads as a deliberate accent rather than decoration.
// ------------------------------------------------------------------

import { RequestRecord } from "@/api/slices/new.request.slice";
import { Animated, Easing, View, StyleSheet, Platform } from "react-native";
import { AppText } from "./AppText";
import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

// ------------------------------------------------------------------
// Date & Time Formatting
// ------------------------------------------------------------------
export const ORDINAL_EXCEPTIONS = [11, 12, 13];

export function ordinal(n: number) {
  if (ORDINAL_EXCEPTIONS.includes(n % 100)) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function formatTime12h(timeStr?: string) {
  if (!timeStr) return null;
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minutes = m.toString().padStart(2, "0");
  return `${hour12}:${minutes}${period}`;
}

export function formatFullDateTime(
  dateInput?: string | Date | null,
  timeStr?: string | null
) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;

  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const day = ordinal(d.getDate());
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const year = d.getFullYear();

  const time =
    formatTime12h(timeStr) ||
    d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(" ", "")
      .toLowerCase();

  return `${weekday} ${day} ${month} ${year} · ${time}`;
}

// ------------------------------------------------------------------
// Meta Helpers
// ------------------------------------------------------------------
export function prettifyKey(key: string) {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");
  return spaced
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatMetaValue(value: unknown) {
  if (value == null) return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  const str = String(value).trim();
  return str.length ? str : null;
}

export function getMetaEntries(meta?: Record<string, any> | null) {
  if (!meta || typeof meta !== "object") return [];
  return Object.entries(meta)
    .map(([key, value]) => ({
      key,
      label: prettifyKey(key),
      value: formatMetaValue(value),
    }))
    .filter((entry) => entry.value !== null);
}

// ------------------------------------------------------------------
// Design Tokens — "Cargo Waybill" palette
// ------------------------------------------------------------------
// Ink navy: the hero's resting, unresolved state (submitted / in transit)
export const INK = "#9C2583";
export const INK_DEEP = "#4A148C";

// Cargo teal: the disciplined, everywhere accent — icons, pills, rings
export const ACCENT_FROM = "#9C2583";
export const ACCENT_TO = "#4A148C";

// Amber flag: spent in exactly one place — the primary call-to-action
// gradient and the "match found" hero — so it reads as a signal, not wallpaper.
export const CTA_FROM = "#9C2583";
export const CTA_TO = "#F3E5F5";

export const SUCCESS = "#1E8E5A";
export const SUCCESS_BG_DARK = "rgba(30,142,90,0.16)";
export const SUCCESS_BG_LIGHT = "rgba(30,142,90,0.10)";

export const WARNING = "#B45309";
export const WARNING_BG = "rgba(232,162,61,0.18)";

export const DANGER = "#D64545";
export const DANGER_BG = "rgba(214,69,69,0.14)";

export const INFO_BG_DARK = "rgba(14,124,134,0.16)";
export const INFO_BG_LIGHT = "rgba(14,124,134,0.08)";

export const MONO_FONT = Platform.select({
  ios: "Courier",
  android: "monospace",
  default: "monospace",
});

// ------------------------------------------------------------------
// Presentational Components
// ------------------------------------------------------------------
export function DetailRow({
    icon,
    label,
    value,
    styles,
    theme,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string | number | null;
    styles: any;
    theme: any;
  }) {
    if (value === null || value === undefined || value === "") return null;
  
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailIconBox}>
          {React.cloneElement(icon as React.ReactElement<any>, { color: "#FFFFFF" })}
        </View>
        <View style={styles.detailTextContainer}>
          <AppText size={12} weight="medium" color={theme.textMuted}>
            {label.toUpperCase()}
          </AppText>
          <AppText size={15} weight="semibold" color={theme.text}>
            {value}
          </AppText>
        </View>
      </View>
    );
  }
  export function StatusPill({
    status,
    styles,
    theme,
  }: {
    status?: RequestRecord["status"];
    styles: any;
    theme: any;
  }) {
    if (!status) return null;
  
    const labels: Record<string, string> = {
      pending: "Pending",
      assigned: "Assigned",
      in_progress: "In Transit",
      completed: "Delivered",
      cancelled: "Cancelled",
      expired: "Expired",
    };
  
    const label = labels[status] || status;
  
    return (
      <View
        style={[
          styles.statusPillBase,
          {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[styles.statusPillDot, { backgroundColor: theme.textMuted }]}
        />
        <AppText
          size={12}
          weight="bold"
          color={theme.text}
          style={styles.monoLabel}
        >
          {label.toUpperCase()}
        </AppText>
      </View>
    );
  }

// ------------------------------------------------------------------
// Manifest perforation — the signature ticket-stub divider that sits
// between the ID block and the route timeline on the hero card.
// ------------------------------------------------------------------
export function ManifestPerforation({ styles }: { styles: any }) {
  return (
    <View style={styles.perforationRow}>
      <View style={styles.notchCircle} />
      <View style={styles.perforationLine} />
      <View style={styles.notchCircle} />
    </View>
  );
}

// ------------------------------------------------------------------
// Timeline — waypoint markers on a dashed route line, in keeping with
// a manifest rather than a generic step-progress bar.
// ------------------------------------------------------------------
export const TIMELINE_STAGES = [
  {
    key: "received",
    label: "Received",
    statuses: ["pending", "assigned", "in_progress", "completed"],
  },
  {
    key: "in_transit",
    label: "In Transit",
    statuses: ["in_progress", "completed"],
  },
  { key: "delivered", label: "Delivered", statuses: ["completed"] },
];

export function TrackingTimeline({
  status,
  styles,
  theme,
}: {
  status?: RequestRecord["status"];
  styles: any;
  theme: any;
}) {
  if (status === "cancelled") return null;

  return (
    <View style={styles.timelineRow}>
      {TIMELINE_STAGES.map((stage, idx) => {
        const done = status ? stage.statuses.includes(status) : false;
        const isLast = idx === TIMELINE_STAGES.length - 1;

        return (
          <React.Fragment key={stage.key}>
            <View style={styles.timelineStageContainer}>
              <View
                style={[
                  styles.timelineDot,
                  done ? styles.timelineDotDone : styles.timelineDotPending,
                ]}
              >
                {done && (
                  <Ionicons name="checkmark" size={13} color={INK_DEEP} />
                )}
              </View>
              <AppText
                size={11}
                weight={done ? "bold" : "medium"}
                color={done ? theme.text : theme.textMuted}
                style={styles.timelineLabel}
              >
                {stage.label.toUpperCase()}
              </AppText>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.timelineConnector,
                  done && styles.timelineConnectorDone,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ------------------------------------------------------------------
// Shimmer Skeleton
// ------------------------------------------------------------------
export function ShimmerBlock({
  width,
  height,
  style,
  radius = 10,
  color,
}: {
  width: number | string;
  height: number;
  style?: any;
  radius?: number;
  color: string;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: color,
          opacity: shimmer.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 0.85],
          }),
        },
        style,
      ]}
    />
  );
}

export function RequestDetailsSkeleton({
  styles,
  shimmerColor,
}: {
  styles: any;
  shimmerColor: string;
}) {
  return (
    <View style={{ width: "100%" }}>
      <ShimmerBlock
        width="100%"
        height={140}
        radius={20}
        color={shimmerColor}
        style={{ marginBottom: 20 }}
      />
      <View style={styles.infoCard}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.detailRow}>
            <ShimmerBlock
              width={40}
              height={40}
              radius={10}
              color={shimmerColor}
              style={{ marginRight: 14 }}
            />
            <View style={{ flex: 1 }}>
              <ShimmerBlock
                width="45%"
                height={9}
                color={shimmerColor}
                style={{ marginBottom: 8 }}
              />
              <ShimmerBlock width="85%" height={15} color={shimmerColor} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------
// Type Helpers
// ------------------------------------------------------------------
export const isPackageType = (type?: RequestRecord["type"]) =>
  type === "send-package" || type === "deliver-package";

export function titlesFor(type?: RequestRecord["type"]) {
  const isPackage = isPackageType(type);
  return {
    isPackage,
    titleSubmitted: isPackage ? "Request Submitted" : "Availability Submitted",
    subSubmitted: isPackage
      ? "We've received your parcel details and will start finding the best match."
      : "We'll start finding parcels that match your route and preferences.",
    searchingTitle: isPackage
      ? "Searching for Traveler"
      : "Searching for Parcels",
    searchingSub: isPackage
      ? "We're finding available travelers near your route."
      : "We're checking parcel requests that match your route and availability.",
    matchTitle: isPackage ? "Match Found" : "You've Got a Match!",
    matchSub: isPackage
      ? "We found a traveler for your parcel."
      : "A parcel owner has locked in with you. Open chat to discuss the details.",
  };
}

// ------------------------------------------------------------------
// Shared Styles (kept for compatibility with any other consumers)
// ------------------------------------------------------------------
export const getPairingStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    detailIconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
      borderWidth: 1,
    },
    detailTextContainer: {
      flex: 1,
    },

    statusPillBase: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    statusPillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    timelineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 10,
    },
    timelineStageContainer: {
      alignItems: "center",
      width: 68,
    },
    timelineDot: {
      width: 24,
      height: 24,
      borderRadius: 6,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 7,
    },
    timelineDotDone: {
      backgroundColor: "#fff",
    },
    timelineDotPending: {
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: "rgba(255,255,255,0.4)",
    },
    timelineConnector: {
      flex: 1,
      height: 0,
      borderTopWidth: 1.5,
      borderStyle: "dashed",
      borderColor: "rgba(255,255,255,0.3)",
      marginTop: 12,
    },
    timelineConnectorDone: {
      borderColor: "#fff",
      borderStyle: "solid",
    },

    infoCard: {
      width: "100%",
      backgroundColor: theme.surface,
      borderRadius: 18,
      padding: 18,
   
    },
  });
