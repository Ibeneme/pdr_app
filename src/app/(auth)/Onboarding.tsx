import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Package,
  MapPin,
  ShieldCheck,
  Sun,
  Moon,
  ArrowRight,
  Truck,
  Lock,
} from "lucide-react-native";

const slides = [
  {
    id: "1",
    animationType: "send-parcel",
    title: "Send Parcels Instantly",
    tagline: "EXPRESS DISPATCH",
    desc: "Got a package to send? Padiman Route connects you with reliable dispatch runners in just a few taps.",
  },
  {
    id: "2",
    animationType: "route-tracking",
    title: "Real-Time Route Tracking",
    tagline: "LIVE TELEMETRY",
    desc: "Keep an eye on your delivery. Track your parcel's route from your doorstep right to your recipient.",
  },
  {
    id: "3",
    animationType: "secure-lock",
    title: "Safe & Secure Deliveries",
    tagline: "ESCROW PROOF",
    desc: "Your padiman has your back. Enjoy secure handling, fair pricing, and lightning-fast delivery times.",
  },
];

export default function OnboardingScreen() {
  const { theme, isDark, setMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useRef(new Animated.Value(0)).current;
  const globalLoop = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Animated.loop(
      Animated.timing(globalLoop, {
        toValue: 1,
        duration: 3200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleFinish = () => {
    router.replace("/(auth)/sign-in");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const glowScale = globalLoop.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  const glowOpacity = globalLoop.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.12, 0.2, 0.12],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient Glow Background */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            backgroundColor: theme.primary,
            width: width * 0.9,
            height: width * 0.9,
            borderRadius: (width * 0.9) / 2,
            top: height * 0.1,
            left: width * 0.05,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleFinish}
          style={styles.skipBtn}
          hitSlop={15}
        >
          <Text style={[styles.skipText, { color: theme.textMuted }]}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: theme.surface }]}
          onPress={() => setMode(isDark ? "light" : "dark")}
        >
          {isDark ? (
            <Sun size={16} color={theme.primary} />
          ) : (
            <Moon size={16} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
          });

          const textTranslateY = scrollX.interpolate({
            inputRange,
            outputRange: [40, 0, -40],
          });

          return (
            <View style={[styles.slide, { width }]}>
              <View style={styles.canvasContainer}>
                <Animated.View
                  style={[
                    styles.heroCanvas,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      opacity,
                      transform: [{ scale }],
                    },
                  ]}
                >
                  {/* Slide 1 - Parcel Box */}
                  {item.animationType === "send-parcel" && (
                    <View style={styles.sceneWrapper}>
                      <Animated.View
                        style={[
                          styles.brownBoxContainer,
                          {
                            transform: [
                              {
                                translateY: globalLoop.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [0, -12, 0],
                                }),
                              },
                              {
                                rotate: globalLoop.interpolate({
                                  inputRange: [0, 0.25, 0.75, 1],
                                  outputRange: [
                                    "0deg",
                                    "-4deg",
                                    "4deg",
                                    "0deg",
                                  ],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <View style={styles.boxFlapLeft} />
                        <View style={styles.boxFlapRight} />
                        <View style={styles.boxTape} />
                        <Package size={52} color="#5D4037" strokeWidth={1.5} />
                      </Animated.View>
                    </View>
                  )}

                  {/* Slide 2 - Route Tracking */}
                  {item.animationType === "route-tracking" && (
                    <View style={styles.sceneWrapper}>
                      <View
                        style={[
                          styles.roadLine,
                          styles.roadHorizontal,
                          { backgroundColor: theme.border },
                        ]}
                      />
                      <View
                        style={[
                          styles.roadLine,
                          styles.roadVertical,
                          { backgroundColor: theme.border },
                        ]}
                      />

                      {/* Start Node */}
                      <View
                        style={[
                          styles.mapPinNode,
                          {
                            left: 30,
                            top: 120,
                            backgroundColor: theme.primary,
                          },
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.pulseRing,
                            {
                              borderColor: theme.primary,
                              transform: [
                                {
                                  scale: globalLoop.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 2.5],
                                  }),
                                },
                              ],
                              opacity: globalLoop.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.6, 0],
                              }),
                            },
                          ]}
                        />
                      </View>

                      {/* Destination Node */}
                      <View
                        style={[
                          styles.mapPinNode,
                          { right: 35, top: 45, backgroundColor: "#E53935" },
                        ]}
                      >
                        <MapPin size={12} color="#FFF" />
                      </View>

                      {/* Moving Truck */}
                      <Animated.View
                        style={[
                          styles.movingVehicle,
                          {
                            backgroundColor: theme.surface,
                            borderColor: theme.primary,
                            transform: [
                              {
                                translateX: globalLoop.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [40, 170],
                                }),
                              },
                              {
                                translateY: globalLoop.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [105, 45],
                                }),
                              },
                              {
                                rotate: globalLoop.interpolate({
                                  inputRange: [0, 0.5, 0.51, 1],
                                  outputRange: [
                                    "0deg",
                                    "0deg",
                                    "-90deg",
                                    "-90deg",
                                  ],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Truck size={16} color={theme.primary} />
                      </Animated.View>
                    </View>
                  )}

                  {/* Slide 3 - Secure Lock */}
                  {item.animationType === "secure-lock" && (
                    <View style={styles.sceneWrapper}>
                      <Animated.View
                        style={[
                          styles.secureScannerRing,
                          {
                            borderColor: theme.primary,
                            transform: [
                              {
                                rotate: globalLoop.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0deg", "360deg"],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.secureScannerRing,
                          styles.innerScannerRing,
                          {
                            borderColor: theme.border,
                            transform: [
                              {
                                rotate: globalLoop.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["360deg", "0deg"],
                                }),
                              },
                            ],
                          },
                        ]}
                      />

                      <Animated.View
                        style={[
                          styles.lockCenterCore,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                            transform: [
                              {
                                translateY: globalLoop.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [0, -10, 0],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <ShieldCheck
                          size={36}
                          color={theme.primary}
                          strokeWidth={2}
                        />
                        <View style={styles.miniLockTag}>
                          <Lock size={10} color="#FFF" />
                        </View>
                      </Animated.View>
                    </View>
                  )}
                </Animated.View>
              </View>

              {/* Text Content */}
              <Animated.View
                style={[
                  styles.textContainer,
                  {
                    opacity,
                    transform: [{ translateY: textTranslateY }],
                  },
                ]}
              >
                <View
                  style={[styles.tagBadge, { backgroundColor: theme.surface }]}
                >
                  <Text style={[styles.tagText, { color: theme.primary }]}>
                    {item.tagline}
                  </Text>
                </View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.desc, { color: theme.textMuted }]}>
                  {item.desc}
                </Text>
              </Animated.View>
            </View>
          );
        }}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const dotScaleX = scrollX.interpolate({
              inputRange,
              outputRange: [1, 2.5, 1],
              extrapolate: "clamp",
            });

            const dotColor = scrollX.interpolate({
              inputRange,
              outputRange: [theme.border, theme.primary, theme.border],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: dotColor as any,
                    transform: [{ scaleX: dotScaleX }],
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.actionBtnText}>
            {currentIndex === slides.length - 1 ? "Get Moving" : "Next"}
          </Text>
          <View style={styles.arrowIconFrame}>
            <ArrowRight size={16} color={theme.primary} strokeWidth={3} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientGlow: {
    position: "absolute",
    zIndex: 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: {
    fontFamily: "RethinkSans-Medium",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  canvasContainer: {
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  heroCanvas: {
    width: 220,
    height: 220,
    borderRadius: 54,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  sceneWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  // Box Styles
  brownBoxContainer: {
    width: 110,
    height: 110,
    backgroundColor: "#D7CCC8",
    borderColor: "#8D6E63",
    borderWidth: 3,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#5D4037",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  boxFlapLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "50%",
    height: 28,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#8D6E63",
    backgroundColor: "#CA9B88",
    borderTopLeftRadius: 12,
  },
  boxFlapRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "50%",
    height: 28,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#8D6E63",
    backgroundColor: "#CA9B88",
    borderTopRightRadius: 12,
  },
  boxTape: {
    position: "absolute",
    top: 26,
    width: 18,
    height: "75%",
    backgroundColor: "#BCAAA4",
    opacity: 0.7,
  },

  // Route Styles
  roadLine: { position: "absolute", borderRadius: 4 },
  roadHorizontal: { width: "100%", height: 16, top: 120 },
  roadVertical: { width: 16, height: "100%", left: 153 },
  mapPinNode: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
    zIndex: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  movingVehicle: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 6,
  },

  // Security Styles
  secureScannerRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  innerScannerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderStyle: "solid",
  },
  lockCenterCore: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  miniLockTag: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#4CAF50",
    padding: 4,
    borderRadius: 10,
  },

  // Text Styles
  textContainer: {
    paddingHorizontal: 36,
    alignItems: "center",
    marginTop: 24,
    zIndex: 2,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tagText: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "RethinkSans-Bold",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  desc: {
    fontFamily: "RethinkSans-Regular",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },

  // Footer
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  indicatorContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    height: 6,
    width: 8,
    borderRadius: 3,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingLeft: 24,
    paddingRight: 12,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtnText: {
    color: "#FFF",
    fontFamily: "RethinkSans-Bold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  arrowIconFrame: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
});
