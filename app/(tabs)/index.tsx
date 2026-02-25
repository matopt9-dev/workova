import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform, RefreshControl, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService, Job } from "@/lib/storage";
import { JOB_CATEGORIES, getCategoryLabel } from "@/lib/categories";
import { theme } from "@/components/ui/theme";
import { ServiceIconTile } from "@/components/ui/ServiceIconTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";

function JobCard({ job }: { job: Job }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        style={styles.jobCard}
      >
        <View style={styles.jobCardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: job.status === "open" ? theme.colors.successLight : "#EFF6FF" }]}>
            <Text style={[styles.statusText, { color: job.status === "open" ? theme.colors.success : theme.colors.info }]}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace("_", " ")}
            </Text>
          </View>
          <Text style={styles.jobBudget}>${job.budgetMin} – ${job.budgetMax}</Text>
        </View>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobDescription} numberOfLines={2}>{job.description}</Text>
        <View style={styles.jobFooter}>
          <View style={styles.jobCategoryTag}>
            <Text style={styles.jobCategoryText}>{getCategoryLabel(job.categoryId)}</Text>
          </View>
          <Text style={styles.jobDate}>{new Date(job.createdAt).toLocaleDateString()}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async () => {
    const jobs = await StorageService.getOpenJobs(user?.id);
    setOpenJobs(jobs.slice(0, 10));
  }, [user?.id]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  }, [loadJobs]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const ListHeader = () => (
    <View>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 14 }]}>
        <View>
          <Text style={styles.greeting}>
            {user ? `Hi, ${user.displayName}` : "Welcome to Workova"}
          </Text>
          <Text style={styles.subGreeting}>Find trusted help nearby</Text>
        </View>
        {!user ? (
          <Pressable onPress={() => router.push("/(auth)/login")} style={styles.signInButton}>
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/job-create")}
            style={({ pressed }) => [styles.createButton, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Services</Text>
      </View>
      <FlatList
        data={JOB_CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        renderItem={({ item }) => (
          <ServiceIconTile
            icon={item.icon}
            label={item.label}
            onPress={() => {
              if (!user) { router.push("/(auth)/login"); }
              else { router.push("/job-create"); }
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={!!JOB_CATEGORIES.length}
      />

      {user && (
        <View style={styles.quickActions}>
          <Pressable
            onPress={() => router.push("/job-create")}
            style={({ pressed }) => [styles.actionCard, styles.actionCardPrimary, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Ionicons name="add-circle-outline" size={28} color="#fff" />
            <Text style={styles.actionTextPrimary}>Post a Job</Text>
            <Text style={styles.actionSubPrimary}>Hire trusted pros</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (user.role === "customer") { router.push("/worker-onboarding"); }
              else { router.push("/(tabs)/jobs"); }
            }}
            style={({ pressed }) => [styles.actionCard, styles.actionCardSecondary, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Ionicons name="construct-outline" size={28} color={theme.colors.primary} />
            <Text style={styles.actionTextSecondary}>
              {user.role === "customer" ? "Become a Pro" : "Find Work"}
            </Text>
            <Text style={styles.actionSubSecondary}>
              {user.role === "customer" ? "Earn on your skills" : "Browse open jobs"}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Jobs</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={openJobs}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No open jobs nearby"
            subtitle="Be the first to post a job request and receive offers from verified professionals."
          />
        }
        renderItem={({ item }) => <JobCard job={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  listContent: { paddingHorizontal: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: theme.colors.surface,
  },
  greeting: { fontSize: 24, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: -0.3 },
  subGreeting: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, marginTop: 3 },
  signInButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radii.button,
  },
  signInText: { color: "#fff", fontFamily: theme.fonts.bold, fontSize: 14 },
  createButton: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.button,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 14 },
  sectionTitle: { fontSize: 19, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: -0.2 },
  categoriesList: { paddingHorizontal: 20, gap: 10 },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: theme.radii.card,
    gap: 6,
  },
  actionCardPrimary: { backgroundColor: theme.colors.primary, ...theme.shadow },
  actionCardSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  actionTextPrimary: { fontSize: 16, fontFamily: theme.fonts.bold, color: "#fff" },
  actionSubPrimary: { fontSize: 12, fontFamily: theme.fonts.regular, color: "rgba(255,255,255,0.75)" },
  actionTextSecondary: { fontSize: 16, fontFamily: theme.fonts.bold, color: theme.colors.text },
  actionSubSecondary: { fontSize: 12, fontFamily: theme.fonts.regular, color: theme.colors.subtext },
  jobCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.xs,
  },
  statusText: { fontSize: 12, fontFamily: theme.fonts.semibold },
  jobBudget: { fontSize: 15, fontFamily: theme.fonts.bold, color: theme.colors.primary },
  jobTitle: { fontSize: 16, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 4, letterSpacing: -0.1 },
  jobDescription: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, lineHeight: 21 },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  jobCategoryTag: {
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.xs,
  },
  jobCategoryText: { fontSize: 12, fontFamily: theme.fonts.semibold, color: theme.colors.subtext, textTransform: "capitalize" },
  jobDate: { fontSize: 12, fontFamily: theme.fonts.regular, color: theme.colors.muted },
});
