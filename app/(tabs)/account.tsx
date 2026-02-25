import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService, WorkerProfile } from "@/lib/storage";
import { theme } from "@/components/ui/theme";
import { Card } from "@/components/ui/Card";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { TrustBadgesRow } from "@/components/ui/TrustBadgesRow";

function SettingsRow({ icon, label, value, onPress }: { icon: string; label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.settingsRow, { opacity: pressed && onPress ? 0.7 : 1 }]}
    >
      <View style={styles.settingsRowLeft}>
        <View style={styles.settingsIconWrap}>
          <Ionicons name={icon as any} size={18} color={theme.colors.subtext} />
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <View style={styles.settingsRowRight}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />}
      </View>
    </Pressable>
  );
}

export default function AccountScreen() {
  const { user, signOut, updateRole } = useAuth();
  const insets = useSafeAreaInsets();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);

  useEffect(() => {
    if (user) {
      StorageService.getWorkerProfile(user.id).then(setWorkerProfile);
    }
  }, [user?.id]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const handleRoleChange = (role: "customer" | "worker" | "both") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateRole(role);
    if ((role === "worker" || role === "both") && !workerProfile) {
      router.push("/worker-onboarding");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete ALL your data including your profile, jobs, messages, offers, and conversations. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await StorageService.deleteAccount(user.id);
            signOut();
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.logoWrap}>
          <Ionicons name="briefcase" size={44} color={theme.colors.primary} />
        </View>
        <Text style={styles.welcomeTitle}>Workova</Text>
        <Text style={styles.welcomeSub}>Find trusted help or get hired for work</Text>
        <View style={{ width: "100%", gap: 12, marginTop: 8, paddingHorizontal: 24 }}>
          <PrimaryButton title="Sign In" onPress={() => router.push("/(auth)/login")} />
          <SecondaryButton title="Create Account" onPress={() => router.push("/(auth)/register")} />
        </View>
        <TrustBadgesRow variant="auth" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 + webBottomInset }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.profileHeader, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 18 }]}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {user.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{user.displayName}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {user.role === "both" ? "Customer & Worker" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How do you use Workova?</Text>
        <View style={styles.roleCards}>
          {(["customer", "worker", "both"] as const).map((role) => {
            const isActive = user.role === role;
            const labels: Record<string, { title: string; sub: string; icon: string }> = {
              customer: { title: "Customer", sub: "Hire professionals", icon: "search-outline" },
              worker: { title: "Worker", sub: "Find jobs & earn", icon: "construct-outline" },
              both: { title: "Both", sub: "Hire & get hired", icon: "swap-horizontal-outline" },
            };
            const info = labels[role];
            return (
              <Pressable
                key={role}
                onPress={() => handleRoleChange(role)}
                style={({ pressed }) => [
                  styles.roleCard,
                  isActive && styles.roleCardActive,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Ionicons name={info.icon as any} size={22} color={isActive ? "#fff" : theme.colors.primary} />
                <Text style={[styles.roleCardTitle, isActive && styles.roleCardTitleActive]}>{info.title}</Text>
                <Text style={[styles.roleCardSub, isActive && styles.roleCardSubActive]}>{info.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {(user.role === "worker" || user.role === "both") && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Worker Profile</Text>
          <Card noPadding>
            {workerProfile ? (
              <>
                <SettingsRow icon="person-outline" label="Display Name" value={workerProfile.displayName} />
                <SettingsRow icon="star-outline" label="Rating" value={workerProfile.ratingCount > 0 ? `${workerProfile.ratingAvg.toFixed(1)} (${workerProfile.ratingCount})` : "No ratings yet"} />
                <SettingsRow icon="location-outline" label="Service Radius" value={`${workerProfile.serviceRadius} km`} />
                <SettingsRow icon="create-outline" label="Edit Profile" onPress={() => router.push("/worker-onboarding")} />
              </>
            ) : (
              <Pressable
                onPress={() => router.push("/worker-onboarding")}
                style={({ pressed }) => [styles.setupProfileBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <View style={styles.setupIconWrap}>
                  <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.setupProfileTitle}>Set Up Worker Profile</Text>
                  <Text style={styles.setupProfileSub}>Complete your profile to start finding work</Text>
                </View>
              </Pressable>
            )}
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Card noPadding>
          <SettingsRow icon="people-circle-outline" label="Community Guidelines" onPress={() => router.push("/community-guidelines")} />
          <SettingsRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push("/privacy-policy")} />
          <SettingsRow icon="document-text-outline" label="Terms of Service" onPress={() => router.push("/terms-of-service")} />
          <SettingsRow icon="help-circle-outline" label="Help & Support" onPress={() => router.push("/help-support")} />
          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [styles.settingsRow, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIconWrap, { backgroundColor: theme.colors.errorLight }]}>
                <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
              </View>
              <Text style={[styles.settingsLabel, { color: theme.colors.error }]}>Delete Account</Text>
            </View>
            <View style={styles.settingsRowRight}>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.error} />
            </View>
          </Pressable>
        </Card>
      </View>

      <Pressable
        testID="settings.logout"
        onPress={handleSignOut}
        style={({ pressed }) => [styles.signOutBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <Text style={styles.version}>Workova v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { alignItems: "center", justifyContent: "center", gap: 12 },
  logoWrap: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  welcomeTitle: { fontSize: 30, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: -0.5 },
  welcomeSub: { fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.subtext, textAlign: "center" },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 28,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    ...theme.shadow,
  },
  profileAvatarText: { fontSize: 30, fontFamily: theme.fonts.bold, color: "#fff" },
  profileName: { fontSize: 24, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: -0.3 },
  profileEmail: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, marginTop: 3 },
  roleBadge: {
    marginTop: 12,
    backgroundColor: theme.colors.primarySurface,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: theme.radii.sm,
  },
  roleBadgeText: { fontSize: 13, fontFamily: theme.fonts.semibold, color: theme.colors.primary },
  section: { paddingHorizontal: 20, paddingTop: 28 },
  sectionTitle: { fontSize: 17, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 14, letterSpacing: -0.2 },
  roleCards: { flexDirection: "row", gap: 10 },
  roleCard: {
    flex: 1,
    padding: 16,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: "center",
    gap: 6,
    ...theme.shadowLight,
  },
  roleCardActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  roleCardTitle: { fontSize: 14, fontFamily: theme.fonts.bold, color: theme.colors.text },
  roleCardTitleActive: { color: "#fff" },
  roleCardSub: { fontSize: 11, fontFamily: theme.fonts.regular, color: theme.colors.subtext, textAlign: "center" },
  roleCardSubActive: { color: "rgba(255,255,255,0.8)" },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: { fontSize: 15, fontFamily: theme.fonts.medium, color: theme.colors.text },
  settingsRowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingsValue: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext },
  setupProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  setupIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  setupProfileTitle: { fontSize: 15, fontFamily: theme.fonts.semibold, color: theme.colors.primary },
  setupProfileSub: { fontSize: 13, fontFamily: theme.fonts.regular, color: theme.colors.subtext, marginTop: 2 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: theme.radii.button,
    backgroundColor: theme.colors.errorLight,
  },
  signOutText: { fontSize: 15, fontFamily: theme.fonts.bold, color: theme.colors.error },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.muted,
    marginTop: 18,
    marginBottom: 8,
  },
});
