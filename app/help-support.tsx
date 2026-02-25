import { ScrollView, View, Text, StyleSheet, Pressable, Platform, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/components/ui/theme";
import { Card } from "@/components/ui/Card";

const FAQ = [
  {
    q: "How do I post a job?",
    a: "Tap the \"+\" button on the home screen, choose a service category, describe the work needed, and set your budget range. Verified workers will see your listing and submit offers.",
  },
  {
    q: "How do I become a worker?",
    a: "Go to Account, select the \"Worker\" or \"Both\" role, and complete your professional profile. Once set up, you can browse and submit offers on open jobs.",
  },
  {
    q: "How do payments work?",
    a: "Currently, payments are arranged directly between customers and workers. We recommend discussing payment terms in the in-app chat before starting work.",
  },
  {
    q: "How do I message someone?",
    a: "Once an offer is accepted on a job, a chat thread is automatically created between the customer and worker. You can access all conversations from the Messages tab.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. All data is stored securely on your device. We use industry-standard encryption for any data in transit. See our Privacy Policy for full details.",
  },
  {
    q: "How do I report a problem?",
    a: "Contact us at support@workova.app with a description of the issue. We aim to respond within 24 hours.",
  },
];

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.contactCard}>
          <View style={styles.contactIconWrap}>
            <Ionicons name="mail-outline" size={28} color={theme.colors.primary} />
          </View>
          <Text style={styles.contactTitle}>Need help?</Text>
          <Text style={styles.contactSub}>
            Reach out any time and we'll get back to you within 24 hours.
          </Text>
          <Pressable
            onPress={() => Linking.openURL("mailto:support@workova.app")}
            style={({ pressed }) => [styles.contactBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Ionicons name="send-outline" size={16} color="#fff" />
            <Text style={styles.contactBtnText}>Email Support</Text>
          </Pressable>
        </View>

        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

        {FAQ.map((item, i) => (
          <Card key={i} style={styles.faqCard}>
            <View style={styles.faqRow}>
              <View style={styles.faqIconWrap}>
                <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.faqQuestion}>{item.q}</Text>
            </View>
            <Text style={styles.faqAnswer}>{item.a}</Text>
          </Card>
        ))}
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
  contactCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: 28,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  contactIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  contactTitle: { fontSize: 20, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 6, letterSpacing: -0.2 },
  contactSub: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, textAlign: "center", lineHeight: 21, marginBottom: 18 },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.radii.button,
  },
  contactBtnText: { fontSize: 15, fontFamily: theme.fonts.bold, color: "#fff" },
  faqTitle: { fontSize: 19, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 16, letterSpacing: -0.2 },
  faqCard: { marginBottom: 12 },
  faqRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  faqIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  faqQuestion: { fontSize: 15, fontFamily: theme.fonts.bold, color: theme.colors.text, flex: 1, letterSpacing: -0.1 },
  faqAnswer: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, lineHeight: 21, paddingLeft: 40 },
});
