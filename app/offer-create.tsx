import { useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ActivityIndicator, Animated } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService } from "@/lib/storage";
import { moderateContent } from "@/lib/moderation";
import { theme } from "@/components/ui/theme";
import { TrustBadgesRow } from "@/components/ui/TrustBadgesRow";

export default function OfferCreateScreen() {
  const { jobId, jobTitle, customerId } = useLocalSearchParams<{ jobId: string; jobTitle: string; customerId: string }>();
  const { user } = useAuth();
  const [price, setPrice] = useState("");
  const [etaText, setEtaText] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  async function handleSubmit() {
    if (!user || !jobId) return;
    const priceVal = Number(price);
    if (!priceVal || priceVal <= 0) return Alert.alert("Invalid Price", "Please enter a valid price.");
    if (!etaText.trim()) return Alert.alert("ETA Required", "Please provide an estimated time.");

    if (message.trim()) {
      const msgCheck = moderateContent(message);
      if (!msgCheck.isClean) return Alert.alert("Content Not Allowed", msgCheck.reason || "Your message contains inappropriate content.");
    }
    const etaCheck = moderateContent(etaText);
    if (!etaCheck.isClean) return Alert.alert("Content Not Allowed", etaCheck.reason || "Your text contains inappropriate content.");

    setSaving(true);
    try {
      const workerProfile = await StorageService.getWorkerProfile(user.id);
      await StorageService.createOffer({
        id: Crypto.randomUUID(),
        jobId,
        workerId: user.id,
        workerName: workerProfile?.displayName || user.displayName,
        customerId: customerId || "",
        price: priceVal,
        etaText: etaText.trim(),
        message: message.trim(),
        status: "sent",
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not submit offer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <Text style={styles.sheetTitle}>Submit Offer</Text>
        <Text style={styles.sheetSub} numberOfLines={1}>for: {jobTitle || "Job"}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Your Price</Text>
        <View style={styles.priceWrap}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor={theme.colors.muted}
            value={price}
            onChangeText={setPrice}
            keyboardType="number-pad"
          />
        </View>

        <Text style={styles.label}>Estimated Completion</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Today 4-6pm, or Within 2 days"
          placeholderTextColor={theme.colors.muted}
          value={etaText}
          onChangeText={setEtaText}
        />

        <Text style={styles.label}>Message (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Introduce yourself and why you're a good fit..."
          placeholderTextColor={theme.colors.muted}
          value={message}
          onChangeText={setMessage}
          multiline
          textAlignVertical="top"
        />

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            onPress={handleSubmit}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
            disabled={saving}
            style={[styles.submitBtn, { opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Send Offer</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <TrustBadgesRow variant="payment" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface, padding: 24 },
  titleSection: { marginBottom: 24 },
  sheetTitle: { fontSize: 22, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: -0.2 },
  sheetSub: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, marginTop: 4 },
  form: { gap: 4 },
  label: {
    fontSize: 14,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 16,
  },
  currency: { fontSize: 24, fontFamily: theme.fonts.bold, color: theme.colors.primary, marginRight: 4 },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    paddingVertical: 15,
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
  textArea: { minHeight: 80 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.radii.button,
    marginTop: 22,
  },
  submitText: { color: "#fff", fontSize: 16, fontFamily: theme.fonts.bold, letterSpacing: 0.2 },
});
