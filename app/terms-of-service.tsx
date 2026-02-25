import { ScrollView, View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/components/ui/theme";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    body: "By accessing or using Workova, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.",
  },
  {
    title: "User Accounts",
    body: "You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. Workova reserves the right to suspend accounts that violate these terms.",
  },
  {
    title: "Service Marketplace",
    body: "Workova connects customers with service professionals. We do not employ workers directly. Workers are independent contractors responsible for the quality of their work and compliance with local regulations.",
  },
  {
    title: "Payments & Fees",
    body: "All payments are processed securely through the platform. Workova may charge service fees on transactions. Refund policies are outlined in our payment terms and vary by service category.",
  },
  {
    title: "User Conduct & Content Policy",
    body: "Users must not engage in fraudulent activity, harassment, discrimination, or any illegal behavior. There is zero tolerance for objectionable content or abusive users. Any user who posts offensive, harassing, discriminatory, or otherwise objectionable content will have their content removed and their account suspended or permanently banned. Workova's moderation team reviews all flagged content within 24 hours. Violations may result in immediate account suspension or termination.",
  },
  {
    title: "Limitation of Liability",
    body: "Workova is not liable for the quality of services provided by workers, disputes between users, or any damages arising from the use of the platform. We encourage users to communicate clearly and document agreements.",
  },
  {
    title: "Dispute Resolution",
    body: "In the event of a dispute, users should first attempt to resolve it directly. If unresolved, Workova offers a mediation process. Further disputes are subject to binding arbitration.",
  },
];

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>
        <Text style={styles.intro}>
          These Terms of Service govern your use of the Workova marketplace platform. Please read them carefully.
        </Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{i + 1}. {s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.contact}>
          Questions? Contact us at legal@workova.app
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
