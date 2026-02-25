import { ScrollView, View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/components/ui/theme";

const SECTIONS = [
  {
    title: "Respect & Inclusivity",
    body: "Workova is a community built on mutual respect. Treat all users with dignity regardless of race, ethnicity, gender, religion, age, disability, or sexual orientation. Harassment, hate speech, and discrimination are strictly prohibited and will result in immediate account suspension.",
  },
  {
    title: "Content Standards",
    body: "All job postings, offers, messages, and profile content must be truthful, relevant, and professional. Do not post misleading descriptions, fake reviews, or content that misrepresents your skills, qualifications, or the nature of a job. All content must comply with local laws and regulations.",
  },
  {
    title: "Prohibited Behavior",
    body: "The following behaviors are not allowed on Workova:\n\n- Spam, phishing, or fraudulent activity\n- Sharing personal information of others without consent\n- Posting inappropriate, obscene, or offensive content\n- Attempting to circumvent platform fees or payment systems\n- Creating multiple accounts to evade bans or restrictions\n- Threatening, intimidating, or bullying other users",
  },
  {
    title: "Zero Tolerance Policy",
    body: "Workova has a zero tolerance policy for objectionable content and abusive users. Any content that is offensive, harassing, discriminatory, sexually explicit, violent, or otherwise objectionable will be removed immediately. Users who post such content will have their accounts suspended or permanently banned without warning.",
  },
  {
    title: "Reporting & Enforcement",
    body: "If you encounter content or behavior that violates these guidelines, please use the in-app report (flag icon) or block feature (ban icon) on any job listing or chat conversation. Blocking a user instantly removes all their content from your feed. Our moderation team reviews all reports within 24 hours and takes appropriate action, which may include content removal, warnings, temporary suspension, or permanent bans depending on the severity of the violation. Reported content may be removed and the offending user ejected from the platform.",
  },
  {
    title: "Account Termination",
    body: "Workova reserves the right to suspend or terminate accounts that violate these community guidelines. Repeated or severe violations will result in permanent removal from the platform. Users who provide objectionable content will be ejected from the platform. Users may appeal account actions by contacting our support team at support@workova.app.",
  },
];

export default function CommunityGuidelinesScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Community Guidelines</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: February 2026</Text>
        <Text style={styles.intro}>
          These guidelines help keep Workova a safe, respectful, and trustworthy platform for everyone. By using Workova, you agree to follow these guidelines.
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
