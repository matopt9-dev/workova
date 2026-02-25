import { useState, useRef, useCallback } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Animated } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/components/ui/theme";
import { PrimaryButton } from "@/components/ui/Button";
import { TrustBadgesRow } from "@/components/ui/TrustBadgesRow";

export default function LoginScreen() {
  const { signIn, signInAsDemo } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleDemoSignIn() {
    setDemoLoading(true);
    try {
      await signInAsDemo();
      router.dismissAll();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not load demo account.");
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleSignIn() {
    if (!email.trim()) return Alert.alert("Missing Email", "Please enter your email address.");
    if (!password.trim()) return Alert.alert("Missing Password", "Please enter your password.");
    setLoading(true);
    try {
      await signIn(email, password);
      router.dismissAll();
    } catch (e: any) {
      Alert.alert("Sign In Failed", e?.message || "Something went wrong.");
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
          <Ionicons name="briefcase" size={40} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to find trusted help or get hired</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={theme.colors.muted} style={styles.inputIcon} />
          <TextInput
            testID="auth.email"
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
            testID="auth.password"
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.muted} />
          </Pressable>
        </View>

        <PrimaryButton testID="auth.submit" title="Sign In" onPress={handleSignIn} loading={loading} disabled={loading} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Link href="/(auth)/register" asChild>
          <Pressable>
            <Text style={styles.link}>Sign Up</Text>
          </Pressable>
        </Link>
      </View>

      <Pressable
        testID="auth.demo"
        onPress={handleDemoSignIn}
        disabled={demoLoading}
        style={({ pressed }) => [styles.demoBtn, { opacity: pressed || demoLoading ? 0.7 : 1 }]}
      >
        <Ionicons name="play-circle-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.demoBtnText}>{demoLoading ? "Loading Demo..." : "Try Demo Account"}</Text>
      </Pressable>

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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    gap: 6,
  },
  footerText: { color: theme.colors.subtext, fontSize: 14, fontFamily: theme.fonts.regular },
  link: { color: theme.colors.primary, fontSize: 14, fontFamily: theme.fonts.bold },
  demoBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: theme.radii.button,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  demoBtnText: { fontSize: 15, fontFamily: theme.fonts.bold, color: theme.colors.primary },
});
