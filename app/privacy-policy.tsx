import { ScrollView, View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/components/ui/theme";

const SECTIONS = [
  {
    title: "Information We Collect",
    body: "We collect information you provide when creating an account (name, email) and when posting or accepting jobs. We also collect device and usage data to improve the app experience.",
  },
  {
    title: "How We Use Your Information",
    body: "Your information is used to facilitate job matching, enable communication between customers and workers, process payments, and improve our services. We never sell your personal data to third parties.",
  },
  {
    title: "Data Security",
    body: "We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest. Access to user data is restricted to authorized personnel only.",
  },
  {
    title: "Your Rights",
    body: "You have the right to access, update, or delete your personal information at any time. You can request a copy of your data or ask us to remove your account by contacting our support team.",
  },
  {
    title: "Third-Party Services",
    body: "We may use third-party services for analytics and payment processing. These services have their own privacy policies, and we encourage you to review them.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this privacy policy from time to time. We will notify you of any significant changes via email or in-app notification.",
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>
        <Text style={styles.intro}>
          Workova is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
        </Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>
          Questions? Contact us at support@workova.app
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: 18, fontFamily: theme.fonts.bold, color: theme.colors.text },
  content: { padding: 20 },
  lastUpdated: { fontSize: 12, fontFamily: theme.fonts.medium, color: theme.colors.muted, marginBottom: 16 },
  intro: { fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.subtext, lineHeight: 23, marginBottom: 24 },
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 8, letterSpacing: -0.1 },
  sectionBody: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, lineHeight: 22 },
  contact: { fontSize: 14, fontFamily: theme.fonts.medium, color: theme.colors.primary, textAlign: "center", marginTop: 16 },
});
