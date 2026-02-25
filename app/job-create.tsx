import { useState, useRef, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, Animated } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService } from "@/lib/storage";
import { moderateContent } from "@/lib/moderation";
import { JOB_CATEGORIES } from "@/lib/categories";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { theme } from "@/components/ui/theme";
import { TrustBadgesRow } from "@/components/ui/TrustBadgesRow";

export default function JobCreateScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [saving, setSaving] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  async function handleCreate() {
    if (!user) return Alert.alert("Sign In Required", "Please sign in to create a job.");
    if (!categoryId) return Alert.alert("Category Required", "Please select a category.");
    if (!title.trim()) return Alert.alert("Title Required", "Please enter a job title.");
    if (!description.trim()) return Alert.alert("Description Required", "Please describe the job.");
    const minVal = Number(budgetMin);
    const maxVal = Number(budgetMax);
    if (!minVal || !maxVal || minVal <= 0) return Alert.alert("Budget Required", "Enter a valid budget range.");
    if (maxVal < minVal) return Alert.alert("Invalid Budget", "Maximum budget must be greater than minimum.");

    const titleCheck = moderateContent(title);
    if (!titleCheck.isClean) return Alert.alert("Content Not Allowed", titleCheck.reason || "Your title contains inappropriate content.");
    const descCheck = moderateContent(description);
    if (!descCheck.isClean) return Alert.alert("Content Not Allowed", descCheck.reason || "Your description contains inappropriate content.");

    setSaving(true);
    try {
      await StorageService.createJob({
        id: Crypto.randomUUID(),
        customerId: user.id,
        customerName: user.displayName,
        categoryId,
        title: title.trim(),
        description: description.trim(),
        budgetMin: minVal,
        budgetMax: maxVal,
        photos: [],
        status: "open",
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not create job.");
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
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 20 }]}
        bottomOffset={60}
      >
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {JOB_CATEGORIES.map((cat) => {
            const isSelected = categoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  setCategoryId(cat.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
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
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Fix leaky kitchen faucet"
          placeholderTextColor={theme.colors.muted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the job in detail so workers understand what's needed..."
          placeholderTextColor={theme.colors.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Budget Range</Text>
        <View style={styles.budgetRow}>
          <View style={styles.budgetInputWrap}>
            <Text style={styles.currencySign}>$</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="Min"
              placeholderTextColor={theme.colors.muted}
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="number-pad"
            />
          </View>
          <Text style={styles.budgetDash}>–</Text>
          <View style={styles.budgetInputWrap}>
            <Text style={styles.currencySign}>$</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="Max"
              placeholderTextColor={theme.colors.muted}
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            onPress={handleCreate}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
            disabled={saving}
            style={[styles.submitBtn, { opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Post Job</Text>
            )}
          </Pressable>
        </Animated.View>

        <TrustBadgesRow variant="payment" />
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
  form: { padding: 20, gap: 4 },
  label: {
    fontSize: 14,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
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
  input: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  textArea: { minHeight: 120 },
  budgetRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  budgetInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 14,
  },
  currencySign: { fontSize: 16, fontFamily: theme.fonts.semibold, color: theme.colors.muted, marginRight: 4 },
  budgetInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  budgetDash: { fontSize: 18, color: theme.colors.muted },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.radii.button,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  submitText: { color: "#fff", fontSize: 16, fontFamily: theme.fonts.bold, letterSpacing: 0.2 },
});
