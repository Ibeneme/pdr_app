import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
} from "react-native";
import { AppText } from "@/components/AppText";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48 - 12) / 2;

export type GeoRegion =
  | "South-South"
  | "South-East"
  | "South-West"
  | "North-Central"
  | "North-West"
  | "North-East";

export interface NigeriaCity {
  id: string;
  name: string;
  state: string;
  region: GeoRegion;
  height: number;
  tagline: string;
}

// Comprehensive dataset matching 36 states + FCT, featuring core towns
const NIGERIA_CITIES: NigeriaCity[] = [
  // --- SOUTH-SOUTH ---
  {
    id: "ss-1",
    name: "Port Harcourt",
    state: "Rivers",
    region: "South-South",
    height: 140,
    tagline: "The Garden City",
  },
  {
    id: "ss-2",
    name: "Bonny Island",
    state: "Rivers",
    region: "South-South",
    height: 125,
    tagline: "Industrial & Coastal Hub",
  },
  {
    id: "ss-3",
    name: "Ahoada",
    state: "Rivers",
    region: "South-South",
    height: 130,
    tagline: "Orashi Region Center",
  },
  {
    id: "ss-4",
    name: "Bori",
    state: "Rivers",
    region: "South-South",
    height: 125,
    tagline: "Heart of Ogoni Land",
  },
  {
    id: "ss-5",
    name: "Eleme",
    state: "Rivers",
    region: "South-South",
    height: 135,
    tagline: "Petrochemical & Port Hub",
  },
  {
    id: "ss-6",
    name: "Uyo",
    state: "Akwa Ibom",
    region: "South-South",
    height: 140,
    tagline: "Land of Promise",
  },
  {
    id: "ss-7",
    name: "Ikot Ekpene",
    state: "Akwa Ibom",
    region: "South-South",
    height: 125,
    tagline: "The Raffia City",
  },
  {
    id: "ss-8",
    name: "Calabar",
    state: "Cross River",
    region: "South-South",
    height: 135,
    tagline: "Canaan City",
  },
  {
    id: "ss-9",
    name: "Asaba",
    state: "Delta",
    region: "South-South",
    height: 130,
    tagline: "The Delta Gateway",
  },
  {
    id: "ss-10",
    name: "Warri",
    state: "Delta",
    region: "South-South",
    height: 140,
    tagline: "Oil City Center",
  },
  {
    id: "ss-11",
    name: "Yenagoa",
    state: "Bayelsa",
    region: "South-South",
    height: 135,
    tagline: "Glory of all Lands",
  },
  {
    id: "ss-12",
    name: "Benin City",
    state: "Edo",
    region: "South-South",
    height: 140,
    tagline: "The Ancient Kingdom",
  },

  // --- SOUTH-EAST ---
  {
    id: "se-1",
    name: "Enugu",
    state: "Enugu",
    region: "South-East",
    height: 135,
    tagline: "The Coal City",
  },
  {
    id: "se-2",
    name: "Nsukka",
    state: "Enugu",
    region: "South-East",
    height: 125,
    tagline: "University Town Hub",
  },
  {
    id: "se-3",
    name: "Owerri",
    state: "Imo",
    region: "South-East",
    height: 140,
    tagline: "Heartland of the East",
  },
  {
    id: "se-4",
    name: "Onitsha",
    state: "Anambra",
    region: "South-East",
    height: 145,
    tagline: "West Africa's Market Hub",
  },
  {
    id: "se-5",
    name: "Awka",
    state: "Anambra",
    region: "South-East",
    height: 130,
    tagline: "Home of Blacksmiths",
  },
  {
    id: "se-6",
    name: "Aba",
    state: "Abia",
    region: "South-East",
    height: 135,
    tagline: "Enyimba City / Commercial Hub",
  },
  {
    id: "se-7",
    name: "Umuahia",
    state: "Abia",
    region: "South-East",
    height: 125,
    tagline: "Pride of the East",
  },
  {
    id: "se-8",
    name: "Abakaliki",
    state: "Ebonyi",
    region: "South-East",
    height: 130,
    tagline: "Salt of the Nation",
  },

  // --- SOUTH-WEST ---
  {
    id: "sw-1",
    name: "Lagos",
    state: "Lagos",
    region: "South-West",
    height: 150,
    tagline: "Centre of Excellence",
  },
  {
    id: "sw-2",
    name: "Ikeja",
    state: "Lagos",
    region: "South-West",
    height: 130,
    tagline: "Capital Industrial Core",
  },
  {
    id: "sw-3",
    name: "Ibadan",
    state: "Oyo",
    region: "South-West",
    height: 140,
    tagline: "The Ancient Brown Roofs",
  },
  {
    id: "sw-4",
    name: "Abeokuta",
    state: "Ogun",
    region: "South-West",
    height: 135,
    tagline: "Under the Rock",
  },
  {
    id: "sw-5",
    name: "Akure",
    state: "Ondo",
    region: "South-West",
    height: 125,
    tagline: "Agricultural Gateway",
  },
  {
    id: "sw-6",
    name: "Osogbo",
    state: "Osun",
    region: "South-West",
    height: 130,
    tagline: "Land of Culture & Art",
  },
  {
    id: "sw-7",
    name: "Ado Ekiti",
    state: "Ekiti",
    region: "South-West",
    height: 125,
    tagline: "Land of Honour",
  },

  // --- NORTH-CENTRAL ---
  {
    id: "nc-1",
    name: "Abuja",
    state: "FCT",
    region: "North-Central",
    height: 145,
    tagline: "Centre of Unity",
  },
  {
    id: "nc-2",
    name: "Jos",
    state: "Plateau",
    region: "North-Central",
    height: 135,
    tagline: "Home of Peace & Tourism",
  },
  {
    id: "nc-3",
    name: "Ilorin",
    state: "Kwara",
    region: "North-Central",
    height: 130,
    tagline: "State of Harmony",
  },
  {
    id: "nc-4",
    name: "Minna",
    state: "Niger",
    region: "North-Central",
    height: 125,
    tagline: "Power State Hub",
  },
  {
    id: "nc-5",
    name: "Lokoja",
    state: "Kogi",
    region: "North-Central",
    height: 130,
    tagline: "The Confluence Town",
  },
  {
    id: "nc-6",
    name: "Makurdi",
    state: "Benue",
    region: "North-Central",
    height: 125,
    tagline: "Food Basket Core",
  },
  {
    id: "nc-7",
    name: "Lafia",
    state: "Nasarawa",
    region: "North-Central",
    height: 125,
    tagline: "Home of Solid Minerals",
  },

  // --- NORTH-WEST ---
  {
    id: "nw-1",
    name: "Kano",
    state: "Kano",
    region: "North-West",
    height: 140,
    tagline: "Centre of Commerce",
  },
  {
    id: "nw-2",
    name: "Kaduna",
    state: "Kaduna",
    region: "North-West",
    height: 135,
    tagline: "Liberal State Hub",
  },
  {
    id: "nw-3",
    name: "Zaria",
    state: "Kaduna",
    region: "North-West",
    height: 125,
    tagline: "Historic Learning Center",
  },
  {
    id: "nw-4",
    name: "Sokoto",
    state: "Sokoto",
    region: "North-West",
    height: 130,
    tagline: "The Caliphate Hub",
  },
  {
    id: "nw-5",
    name: "Katsina",
    state: "Katsina",
    region: "North-West",
    height: 125,
    tagline: "Home of Hospitality",
  },
  {
    id: "nw-6",
    name: "Birnin Kebbi",
    state: "Kebbi",
    region: "North-West",
    height: 125,
    tagline: "Land of Equity",
  },
  {
    id: "nw-7",
    name: "Gusau",
    state: "Zamfara",
    region: "North-West",
    height: 125,
    tagline: "Farming and Trade Center",
  },
  {
    id: "nw-8",
    name: "Dutse",
    state: "Jigawa",
    region: "North-West",
    height: 125,
    tagline: "The New Frontier",
  },

  // --- NORTH-EAST ---
  {
    id: "ne-1",
    name: "Maiduguri",
    state: "Borno",
    region: "North-East",
    height: 135,
    tagline: "Home of Peace",
  },
  {
    id: "ne-2",
    name: "Bauchi",
    state: "Bauchi",
    region: "North-East",
    height: 130,
    tagline: "Pearl of Tourism",
  },
  {
    id: "ne-3",
    name: "Gombe",
    state: "Gombe",
    region: "North-East",
    height: 125,
    tagline: "Jewel in the Savannah",
  },
  {
    id: "ne-4",
    name: "Yola",
    state: "Adamawa",
    region: "North-East",
    height: 130,
    tagline: "Land of Beauty",
  },
  {
    id: "ne-5",
    name: "Jalingo",
    state: "Taraba",
    region: "North-East",
    height: 125,
    tagline: "Nature's Gift",
  },
  {
    id: "ne-6",
    name: "Damaturu",
    state: "Yobe",
    region: "North-East",
    height: 125,
    tagline: "Pride of the Sahel",
  },
];

const REGIONS: ("All" | GeoRegion)[] = [
  "All",
  "South-South",
  "South-East",
  "South-West",
  "North-Central",
  "North-West",
  "North-East",
];

interface NigeriaCitiesGridProps {
  onCityPress?: (city: NigeriaCity) => void;
}

export const NigeriaCitiesGrid: React.FC<NigeriaCitiesGridProps> = ({
  onCityPress,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<"All" | GeoRegion>(
    "All"
  );

  // Combined high-performance sorting filter logic
  const filteredCities = useMemo(() => {
    return NIGERIA_CITIES.filter((city) => {
      const matchesRegion =
        selectedRegion === "All" || city.region === selectedRegion;
      const matchesSearch =
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.region.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [searchQuery, selectedRegion]);

  const leftColumnItems = filteredCities.filter((_, index) => index % 2 === 0);
  const rightColumnItems = filteredCities.filter((_, index) => index % 2 !== 0);

  const renderCard = (city: NigeriaCity) => (
    <TouchableOpacity
      key={city.id}
      activeOpacity={0.85}
      style={[
        styles.cardWrapper,
        {
          height: city.height,
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
      onPress={() => onCityPress?.(city)}
    >
      <View style={styles.cardContent}>
        <View
          style={[
            styles.regionBadge,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <AppText size={9} weight="bold" color={theme.textMuted}>
            {city.region}
          </AppText>
        </View>
        <View>
          <AppText size={15} weight="bold" color={theme.text} numberOfLines={1}>
            {city.name}
          </AppText>
          <AppText size={11} color={theme.textMuted} style={{ marginTop: 1 }}>
            {city.state} State
          </AppText>
          <AppText
            size={10}
            color={theme.textMuted}
            weight="medium"
            numberOfLines={1}
            style={{ marginTop: 4, opacity: 0.7 }}
          >
            {city.tagline}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 🔍 Search bar */}
      <TextInput
        style={[
          styles.searchInput,
          {
            borderColor: theme.border,
            color: theme.text,
            backgroundColor: theme.surface,
          },
        ]}
        placeholder="Search hubs, towns, states..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="while-editing"
      />

      {/* 🧭 Horizontal Regions Filter Switcher */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {REGIONS.map((region) => {
            const isSelected = selectedRegion === region;
            return (
              <TouchableOpacity
                key={region}
                activeOpacity={0.8}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setSelectedRegion(region)}
              >
                <AppText
                  size={12}
                  weight="bold"
                  color={isSelected ? "#FFF" : theme.text}
                >
                  {region}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 🏙️ Dynamic Columns Presentation Layout */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {filteredCities.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText size={14} color={theme.textMuted}>
              No regional hubs found matching criteria.
            </AppText>
          </View>
        ) : (
          <View style={styles.masonryLayoutRow}>
            <View style={styles.columnTrack}>
              {leftColumnItems.map(renderCard)}
            </View>
            <View style={styles.columnTrack}>
              {rightColumnItems.map(renderCard)}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 24, flex: 1 },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 14,
    fontSize: 15,
  },
  tabBarWrapper: {
    marginBottom: 20,
    marginHorizontal: -24,
  },
  tabsScrollContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  masonryLayoutRow: { flexDirection: "row", justifyContent: "space-between" },
  columnTrack: { width: COLUMN_WIDTH, gap: 12 },
  cardWrapper: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardContent: { flex: 1, padding: 14, justifyContent: "space-between" },
  regionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
});
