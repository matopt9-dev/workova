import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/components/ui/theme";
import { PrimaryButton } from "@/components/ui/Button";
import { TrustBadgesRow } from "@/components/ui/TrustBadgesRow";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignUp() {
    if (!displayName.trim()) return Alert.alert("Missing Name", "Please enter your name.");
    if (!email.trim()) return Alert.alert("Missing Email", "Please enter your email.");
    if (password.length < 6) return Alert.alert("Weak Password", "Password must be at least 6 characters.");
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      router.dismissAll();
    } catch (e: any) {
      Alert.alert("Sign Up Failed", e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      bottomOffset={20}
    >
      <View style={styles.heroSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={36} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Join Workova</Text>
        <Text style={styles.subtitle}>Create an account to get started</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={theme.colors.muted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={theme.colors.muted}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={theme.colors.muted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={theme.colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.colors.muted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password (6+ characters)"
            placeholderTextColor={theme.colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.muted} />
          </Pressable>
        </View>

        <PrimaryButton title="Create Account" onPress={handleSignUp} loading={loading} disabled={loading} />
      </View>

      <Text style={styles.disclaimer}>
        By signing up, you agree to Workova's Terms of Service and Privacy Policy.
      </Text>

      <TrustBadgesRow variant="auth" />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { padding: 24, flexGrow: 1 },
  heroSection: { alignItems: "center", marginTop: 20, marginBottom: 40 },
  iconContainer: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 8, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.subtext, textAlign: "center" },
  form: { gap: 14 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.colors.muted,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});
