import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform, RefreshControl, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService, Job } from "@/lib/storage";
import { getCategoryLabel } from "@/lib/categories";
import { theme } from "@/components/ui/theme";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/Button";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "#ECFDF5", text: "#059669" },
  offered: { bg: "#FFF7ED", text: "#D97706" },
  booked: { bg: "#EFF6FF", text: "#2563EB" },
  in_progress: { bg: "#F5F3FF", text: "#7C3AED" },
  complete: { bg: "#F0FDF4", text: "#16A34A" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626" },
};

function JobListItem({ job, offerCount }: { job: Job; offerCount: number }) {
  const statusColor = STATUS_COLORS[job.status] || STATUS_COLORS.open;
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        style={styles.jobItem}
      >
        <View style={styles.jobItemTop}>
          <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>
              {job.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </View>
        <Text style={styles.jobItemTitle}>{job.title}</Text>
        <Text style={styles.jobItemDesc} numberOfLines={2}>{job.description}</Text>
        <View style={styles.jobItemMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.metaText}>{getCategoryLabel(job.categoryId)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={theme.colors.muted} />
            <Text style={styles.metaText}>${job.budgetMin} – ${job.budgetMax}</Text>
          </View>
          {offerCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.metaText, { color: theme.colors.primary, fontFamily: theme.fonts.semibold }]}>
                {offerCount} offer{offerCount !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function JobsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"my" | "browse">(user ? "my" : "browse");
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [browseJobs, setBrowseJobs] = useState<Job[]>([]);
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const browse = await StorageService.getOpenJobs(user?.id, user?.blockedUsers);
    setBrowseJobs(browse);

    if (user) {
      const my = await StorageService.getJobsByCustomer(user.id);
      setMyJobs(my);

      const counts: Record<string, number> = {};
      for (const job of my) {
        const offers = await StorageService.getOffersForJob(job.id);
        if (offers.length > 0) counts[job.id] = offers.length;
      }
      setOfferCounts(counts);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const jobs = tab === "my" ? myJobs : browseJobs;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 14 }]}>
        <Text style={styles.headerTitle}>Jobs</Text>
        {user ? (
          <Pressable
            onPress={() => router.push("/job-create")}
            style={({ pressed }) => [styles.addBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      <View style={styles.tabs}>
        {(["my", "browse"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              if (t === "my" && !user) {
                router.push("/(auth)/login");
                return;
              }
              setTab(t);
            }}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "my" ? "My Jobs" : "Browse"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={jobs}
        renderItem={({ item }) => <JobListItem job={item} offerCount={offerCounts[item.id] || 0} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon={tab === "my" ? "document-outline" : "search-outline"}
            title={tab === "my" ? "No jobs posted yet" : "No open jobs available"}
            subtitle={tab === "my" ? "Create your first job to find trusted help nearby." : "Check back soon for new opportunities from customers in your area."}
          />
        }
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: { fontSize: 24, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: -0.3 },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  tabBtnActive: { backgroundColor: theme.colors.primary },
  tabText: { fontSize: 14, fontFamily: theme.fonts.semibold, color: theme.colors.subtext },
  tabTextActive: { color: "#fff" },
  list: { paddingHorizontal: 20, paddingTop: 14 },
  jobItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  jobItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: theme.radii.xs },
  badgeText: { fontSize: 12, fontFamily: theme.fonts.semibold },
  jobItemTitle: { fontSize: 16, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 4, letterSpacing: -0.1 },
  jobItemDesc: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, lineHeight: 21, marginBottom: 14 },
  jobItemMeta: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: theme.fonts.medium, color: theme.colors.muted },
});
