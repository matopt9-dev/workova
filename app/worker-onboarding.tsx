import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, Animated } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService, WorkerProfile } from "@/lib/storage";
import { JOB_CATEGORIES } from "@/lib/categories";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { theme } from "@/components/ui/theme";
import { TrustBadgesRow } from "@/components/ui/TrustBadgesRow";

export default function WorkerOnboardingScreen() {
  const { user, updateRole } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [radiusKm, setRadiusKm] = useState("15");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (user) {
      StorageService.getWorkerProfile(user.id).then((p) => {
        if (p) {
          setDisplayName(p.displayName);
          setBio(p.bio);
          setRadiusKm(String(p.serviceRadius));
          setSelectedCategories(p.categories);
          setIsExisting(true);
        } else {
          setDisplayName(user.displayName);
        }
      });
    }
  }, [user?.id]);

  function toggleCategory(catId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  }

  async function handleSave() {
    if (!user) return;
    if (!displayName.trim()) return Alert.alert("Name Required", "Please enter your display name.");
    if (selectedCategories.length === 0) return Alert.alert("Categories Required", "Select at least one service category.");
    const radius = Number(radiusKm);
    if (!radius || radius <= 0) return Alert.alert("Invalid Radius", "Enter a valid service radius.");

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const existing = await StorageService.getWorkerProfile(user.id);
      const profile: WorkerProfile = {
        userId: user.id,
        displayName: displayName.trim(),
        bio: bio.trim(),
        categories: selectedCategories,
        serviceRadius: radius,
        ratingAvg: existing?.ratingAvg || 0,
        ratingCount: existing?.ratingCount || 0,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      await StorageService.setWorkerProfile(profile);
      if (user.role === "customer") { await updateRole("both"); }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        isExisting ? "Profile Updated" : "Profile Created",
        isExisting ? "Your worker profile has been updated." : "Your worker profile is ready. You can now browse and offer on jobs.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="close" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{isExisting ? "Edit Profile" : "Worker Setup"}</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 20 }]}
        bottomOffset={60}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="construct" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>
            {isExisting ? "Update your profile" : "Build your professional profile"}
          </Text>
          <Text style={styles.heroSub}>
            A complete profile helps customers trust you and find you for the right jobs.
          </Text>
        </View>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="How customers will see your name"
          placeholderTextColor={theme.colors.muted}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell customers about your experience, skills, and why they should hire you..."
          placeholderTextColor={theme.colors.muted}
          value={bio}
          onChangeText={setBio}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Service Radius (km)</Text>
        <TextInput
          style={styles.input}
          placeholder="15"
          placeholderTextColor={theme.colors.muted}
          value={radiusKm}
          onChangeText={setRadiusKm}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Service Categories</Text>
        <Text style={styles.labelSub}>Select all categories you can work in</Text>
        <View style={styles.categoryGrid}>
          {JOB_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => toggleCategory(cat.id)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                  { transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isSelected ? "#fff" : theme.colors.subtext}
                />
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </Pressable>
            );
          })}
        </View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            onPress={handleSave}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
            disabled={saving}
            style={[styles.submitBtn, { opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{isExisting ? "Update Profile" : "Create Profile"}</Text>
            )}
          </Pressable>
        </Animated.View>

        <TrustBadgesRow variant="provider" />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: 18, fontFamily: theme.fonts.bold, color: theme.colors.text },
  form: { padding: 20 },
  heroSection: { alignItems: "center", marginBottom: 24 },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: { fontSize: 21, fontFamily: theme.fonts.bold, color: theme.colors.text, textAlign: "center", letterSpacing: -0.2 },
  heroSub: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, textAlign: "center", marginTop: 6, lineHeight: 21 },
  label: {
    fontSize: 14,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  labelSub: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.colors.subtext,
    marginBottom: 10,
    marginTop: -4,
  },
  input: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  textArea: { minHeight: 100 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  categoryChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  categoryChipText: { fontSize: 13, fontFamily: theme.fonts.semibold, color: theme.colors.subtext },
  categoryChipTextActive: { color: "#fff" },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.radii.button,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  submitText: { color: "#fff", fontSize: 16, fontFamily: theme.fonts.bold, letterSpacing: 0.2 },
});
