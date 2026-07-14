import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Linking,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";

// --- Design System Tokens (DESIGN.md) ---
const COLORS = {
  surfaceBase: "#F8F9FC",
  surfaceRaised: "#FFFFFF",
  inkPrimary: "#0F172A",
  inkSecondary: "#475569",
  inkDisabled: "#94A3B8",
  accentPrimary: "#2563EB",
  borderHairline: "#E2E8F0",
  
  // Custom child/activity markers
  colorKid1: "#3B82F6", // Blue for Maya
  colorKid2: "#EC4899", // Pink for Leo
  colorKid3: "#10B981", // Green
  
  colorMusic: "#F59E0B", // Gold
  colorSwim: "#06B6D4", // Teal
  
  colorAlertRed: "#EF4444",
  colorAlertOrange: "#F97316",
};

// Mock Calendar Data
const MOCK_EVENTS = [
  {
    id: "e1",
    kid: "Maya",
    kidColor: COLORS.colorKid1,
    title: "Travel Soccer Practice",
    group: "Barca Academy U12",
    time: "4:00 PM - 5:30 PM",
    attire: "Blue Training Kit, shin guards, cleats, water",
    location: "Oak Park Field #4",
    lat: 33.7890,
    lng: -84.3879,
  },
  {
    id: "e2",
    kid: "Leo",
    kidColor: COLORS.colorKid2,
    title: "Ballet Recital Prep",
    group: "Downtown Dance Studio",
    time: "5:15 PM - 6:45 PM",
    attire: "Black leotard, pink tights, ballet shoes",
    location: "Symphony Hall entrance B",
    lat: 33.7899,
    lng: -84.3820,
    isConflict: true,
    conflictMsg: "Conflict: Tight Travel (Less than 10 mins buffer)",
  },
];

export default function App() {
  // Navigation / screen state: "login" | "profile" | "calendar" | "volunteer"
  const [screen, setScreen] = useState<"login" | "profile" | "calendar" | "volunteer">("login");

  // User input states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // Profile states
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [children, setChildren] = useState<{ name: string; age: string }[]>([
    { name: "Maya", age: "11" },
    { name: "Leo", age: "8" }
  ]);

  // Volunteer Shift state
  const [shifts, setShifts] = useState([
    { id: "s1", role: "Timer - Shift 1 (Events 1-30)", time: "8:00 AM - 11:30 AM", claimed: false },
    { id: "s2", role: "Timer - Shift 2 (Events 31-60)", time: "11:30 AM - 2:00 PM", claimed: false },
    { id: "s3", role: "Clerk of Course", time: "8:00 AM - 1:00 PM", claimed: true }
  ]);

  // Maps deep-linking helper (Story 3.3)
  const openMaps = (lat: number, lng: number, label: string) => {
    const scheme = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    
    if (scheme) {
      Linking.openURL(scheme).catch(() => {
        Alert.alert("Maps Integration", "Could not open map navigation link.");
      });
    }
  };

  // COPPA Validation check (Story 1.3)
  const handleAddChild = () => {
    if (!childName || !childAge) {
      Alert.alert("Error", "Please fill in child name and age.");
      return;
    }
    const ageNum = parseInt(childAge, 10);
    if (isNaN(ageNum)) {
      Alert.alert("Error", "Please enter a valid age.");
      return;
    }

    if (ageNum < 13) {
      Alert.alert(
        "COPPA Notice",
        `Under COPPA, ${childName} will be added as a passive sub-profile. They will have no chat or login credentials, and their data will be strictly isolated.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Accept & Save",
            onPress: () => {
              setChildren([...children, { name: childName, age: childAge }]);
              setChildName("");
              setChildAge("");
            }
          }
        ]
      );
    } else {
      setChildren([...children, { name: childName, age: childAge }]);
      setChildName("");
      setChildAge("");
    }
  };

  const handleRegister = () => {
    if (!email || !phone || !parentName) {
      Alert.alert("Registration", "Please fill in all fields.");
      return;
    }
    setScreen("profile");
  };

  const toggleShift = (id: string) => {
    setShifts(shifts.map(s => s.id === id ? { ...s, claimed: !s.claimed } : s));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Omni</Text>
        {screen !== "login" && (
          <TouchableOpacity onPress={() => setScreen("login")} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- LOGIN SCREEN --- */}
      {screen === "login" && (
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={styles.title}>Unified Kids Coordination</Text>
          <Text style={styles.subtitle}>Consolidate calendars, rosters, and alerts across sports, dance, and scouts.</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Parent Registration</Text>
            
            <Text style={styles.label}>Parent Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dave Mills"
              value={parentName}
              onChangeText={setParentName}
              placeholderTextColor={COLORS.inkDisabled}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="name@email.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={COLORS.inkDisabled}
            />

            <Text style={styles.label}>Cell Phone (for Emergency SMS)</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 000-0000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor={COLORS.inkDisabled}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
              <Text style={styles.primaryButtonText}>Continue to Profiles</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* --- PROFILE SETUP SCREEN (Story 1.3) --- */}
      {screen === "profile" && (
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={styles.title}>Roster Sub-Profiles</Text>
          <Text style={styles.subtitle}>Add players. Children under 13 are protected under COPPA guidelines.</Text>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Add a Child Profile</Text>
            
            <Text style={styles.label}>Child First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Maya"
              value={childName}
              onChangeText={setChildName}
              placeholderTextColor={COLORS.inkDisabled}
            />

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 11"
              keyboardType="number-pad"
              value={childAge}
              onChangeText={setChildAge}
              placeholderTextColor={COLORS.inkDisabled}
            />

            <TouchableOpacity style={styles.secondaryButton} onPress={handleAddChild}>
              <Text style={styles.secondaryButtonText}>Add Child</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Active Roster List</Text>
            {children.map((child, index) => (
              <View key={index} style={styles.childItem}>
                <View style={styles.childBadge}>
                  <Text style={styles.childBadgeText}>{child.name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.childItemName}>{child.name}</Text>
                  <Text style={styles.childItemSub}>
                    Age {child.age} • {parseInt(child.age, 10) < 13 ? "COPPA Managed Passive Sub-Profile" : "Standard Minor Profile"}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.primaryButton} onPress={() => setScreen("calendar")}>
              <Text style={styles.primaryButtonText}>Go to Calendar Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* --- CONSOLIDATED CALENDAR (Story 3.1, 3.2, 3.3) --- */}
      {screen === "calendar" && (
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={styles.title}>Family Schedule</Text>
          <Text style={styles.subtitle}>All calendars aggregated by child and color-coded.</Text>

          {/* Conflict Warning Alert Banner */}
          <View style={styles.conflictBanner}>
            <Text style={styles.conflictBannerText}>
              ⚠️ 1 Alert: Maya's Soccer and Leo's Ballet schedules require consecutive travel with zero buffer.
            </Text>
          </View>

          {MOCK_EVENTS.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              {/* Colored child indicator badge */}
              <View style={[styles.childIndicator, { backgroundColor: event.kidColor }]} />
              
              <View style={styles.eventBody}>
                <View style={styles.eventHeaderRow}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={[styles.kidLabel, { color: event.kidColor }]}>{event.kid}</Text>
                </View>
                
                <Text style={styles.eventTime}>{event.time}</Text>
                <Text style={styles.eventMeta}>Group: {event.group}</Text>
                <Text style={styles.eventMeta}>Attire: {event.attire}</Text>

                {/* Location with maps link and touch target validation */}
                <TouchableOpacity
                  style={styles.locationLink}
                  onPress={() => openMaps(event.lat, event.lng, event.location)}
                >
                  <Text style={styles.locationLinkText}>📍 Nav to: {event.location}</Text>
                </TouchableOpacity>

                {/* Event specific conflict overlay */}
                {event.isConflict && (
                  <View style={styles.tightTravelWarning}>
                    <Text style={styles.tightTravelWarningText}>{event.conflictMsg}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.primaryButton} onPress={() => setScreen("volunteer")}>
            <Text style={styles.primaryButtonText}>View Volunteer Shifts</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* --- VOLUNTEER QUOTA SETUP (Story 6.2) --- */}
      {screen === "volunteer" && (
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={styles.title}>Volunteer Quotas</Text>
          <Text style={styles.subtitle}>Claim shifts to support group meets. Current quota requirement: 1 shift per swimmer.</Text>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Swim Meet Shifts - Saturday</Text>
            
            {shifts.map((shift) => (
              <View key={shift.id} style={styles.shiftRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shiftRole}>{shift.role}</Text>
                  <Text style={styles.shiftTime}>{shift.time}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.claimButton,
                    shift.claimed ? styles.claimedButton : styles.unclaimedButton
                  ]}
                  onPress={() => toggleShift(shift.id)}
                >
                  <Text style={[
                    styles.claimButtonText,
                    { color: shift.claimed ? "#FFFFFF" : COLORS.accentPrimary }
                  ]}>
                    {shift.claimed ? "Claimed ✓" : "Claim"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.quotaBox}>
              <Text style={styles.quotaTitle}>Family Status Quota</Text>
              <Text style={styles.quotaStatus}>
                Required: 2 Shifts • Claimed: {shifts.filter(s => s.claimed).length} Shifts
              </Text>
              <Text style={styles.quotaProgress}>
                {shifts.filter(s => s.claimed).length >= 2 ? "✅ Quota Met! Entries declared." : "❌ Quota Incomplete."}
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setScreen("calendar")}>
              <Text style={styles.primaryButtonText}>Return to Calendar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  header: {
    height: 60,
    backgroundColor: COLORS.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderHairline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.inkPrimary,
    letterSpacing: 0.5,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: COLORS.accentPrimary,
    fontWeight: "600",
  },
  screenContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.inkPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.inkSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderHairline,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.inkPrimary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.inkSecondary,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.borderHairline,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.inkPrimary,
  },
  primaryButton: {
    height: 48,
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 48,
    borderColor: COLORS.accentPrimary,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: COLORS.accentPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  childItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderHairline,
  },
  childBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.borderHairline,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  childBadgeText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.inkSecondary,
  },
  childItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.inkPrimary,
  },
  childItemSub: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  conflictBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  conflictBannerText: {
    color: COLORS.colorAlertRed,
    fontWeight: "700",
    lineHeight: 18,
  },
  eventCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderHairline,
    flexDirection: "row",
    overflow: "hidden",
  },
  childIndicator: {
    width: 6,
    height: "100%",
  },
  eventBody: {
    flex: 1,
    padding: 16,
  },
  eventHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.inkPrimary,
    flex: 1,
  },
  kidLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  eventTime: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.accentPrimary,
    marginBottom: 8,
  },
  eventMeta: {
    fontSize: 14,
    color: COLORS.inkSecondary,
    marginBottom: 4,
  },
  locationLink: {
    marginTop: 8,
    paddingVertical: 12, // Ensure touch target fits 44pt/48dp size validation
  },
  locationLinkText: {
    color: COLORS.accentPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  tightTravelWarning: {
    backgroundColor: "#FFEDD5",
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  tightTravelWarningText: {
    color: COLORS.colorAlertOrange,
    fontWeight: "700",
    fontSize: 12,
  },
  shiftRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderHairline,
  },
  shiftRole: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.inkPrimary,
  },
  shiftTime: {
    fontSize: 13,
    color: COLORS.inkSecondary,
  },
  claimButton: {
    paddingHorizontal: 16,
    paddingVertical: 12, // Tap size compliance
    borderRadius: 6,
    justifyContent: "center",
  },
  claimedButton: {
    backgroundColor: COLORS.colorKid3,
  },
  unclaimedButton: {
    backgroundColor: COLORS.surfaceBase,
    borderWidth: 1,
    borderColor: COLORS.borderHairline,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  quotaBox: {
    backgroundColor: COLORS.surfaceBase,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  quotaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.inkPrimary,
    marginBottom: 4,
  },
  quotaStatus: {
    fontSize: 14,
    color: COLORS.inkSecondary,
    marginBottom: 4,
  },
  quotaProgress: {
    fontSize: 15,
    fontWeight: "800",
  },
});
