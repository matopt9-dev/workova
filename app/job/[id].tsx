import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, RefreshControl, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Crypto from "expo-crypto";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService, Job, Offer, Chat, Report } from "@/lib/storage";
import { getCategoryLabel } from "@/lib/categories";
import { theme } from "@/components/ui/theme";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrustBadgesRow } from "@/components/ui/TrustBadgesRow";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "#ECFDF5", text: "#059669" },
  offered: { bg: "#FFF7ED", text: "#D97706" },
  booked: { bg: "#EFF6FF", text: "#2563EB" },
  in_progress: { bg: "#F5F3FF", text: "#7C3AED" },
  complete: { bg: "#F0FDF4", text: "#16A34A" },
  cancelled: { bg: "#FEF2F2", text: "#DC2626" },
};

function OfferCard({ offer, isOwner, onAccept, onReject }: { offer: Offer; isOwner: boolean; onAccept: () => void; onReject: () => void }) {
  const initial = offer.workerName.charAt(0).toUpperCase();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <View style={styles.offerAvatar}>
            <Text style={styles.offerAvatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerName}>{offer.workerName}</Text>
            <Text style={styles.offerEta}>{offer.etaText}</Text>
          </View>
          <Text style={styles.offerPrice}>${offer.price}</Text>
        </View>
        {offer.message ? (
          <Text style={styles.offerMessage}>{offer.message}</Text>
        ) : null}
        {isOwner && offer.status === "sent" && (
          <View style={styles.offerActions}>
            <Pressable
              onPress={onAccept}
              style={({ pressed }) => [styles.acceptBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>
            <Pressable
              onPress={onReject}
              style={({ pressed }) => [styles.rejectBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Ionicons name="close" size={18} color={theme.colors.error} />
              <Text style={styles.rejectText}>Decline</Text>
            </Pressable>
          </View>
        )}
        {offer.status !== "sent" && (
          <View style={[styles.offerStatusBadge, { backgroundColor: offer.status === "accepted" ? theme.colors.successLight : theme.colors.errorLight }]}>
            <Text style={[styles.offerStatusText, { color: offer.status === "accepted" ? theme.colors.success : theme.colors.error }]}>
              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<Job | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [j, o] = await Promise.all([
      StorageService.getJobById(id),
      StorageService.getOffersForJob(id),
    ]);
    setJob(j);
    setOffers(o);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const isOwner = user?.id === job?.customerId;
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  async function handleAcceptOffer(offer: Offer) {
    if (!job || !user) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await StorageService.updateOffer(offer.id, { status: "accepted" });
    for (const o of offers) {
      if (o.id !== offer.id && o.status === "sent") {
        await StorageService.updateOffer(o.id, { status: "rejected" });
      }
    }
    await StorageService.updateJob(job.id, { status: "booked" });
    let chat = await StorageService.findChatByJobAndMembers(job.id, [user.id, offer.workerId]);
    if (!chat) {
      const newChat: Chat = {
        id: Crypto.randomUUID(),
        jobId: job.id,
        jobTitle: job.title,
        members: [user.id, offer.workerId],
        memberNames: { [user.id]: user.displayName, [offer.workerId]: offer.workerName },
        lastMessage: "",
        updatedAt: new Date().toISOString(),
      };
      await StorageService.createChat(newChat);
      chat = newChat;
    }
    await loadData();
    Alert.alert("Offer Accepted", "A chat thread has been created. You can now message this worker.", [
      { text: "Go to Chat", onPress: () => router.push({ pathname: "/chat/[id]", params: { id: chat!.id } }) },
      { text: "Stay Here", style: "cancel" },
    ]);
  }

  async function handleRejectOffer(offer: Offer) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await StorageService.updateOffer(offer.id, { status: "rejected" });
    await loadData();
  }

  async function handleCancelJob() {
    if (!job) return;
    Alert.alert("Cancel Job", "Are you sure you want to cancel this job?", [
      { text: "No", style: "cancel" },
      {
        text: "Cancel Job",
        style: "destructive",
        onPress: async () => {
          await StorageService.updateJob(job.id, { status: "cancelled" });
          await loadData();
        },
      },
    ]);
  }

  async function handleCompleteJob() {
    if (!job) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await StorageService.updateJob(job.id, { status: "complete" });
    await loadData();
  }

  function handleReport() {
    if (!user || !job) return;
    const reasons = ["Spam", "Inappropriate Content", "Fraud/Scam", "Other"];
    Alert.alert("Report this job", "Select a reason:", [
      ...reasons.map((reason) => ({
        text: reason,
        onPress: async () => {
          const report: Report = {
            id: Crypto.randomUUID(),
            reporterId: user.id,
            targetType: "job" as const,
            targetId: job.id,
            reason,
            createdAt: new Date().toISOString(),
          };
          await StorageService.createReport(report);
          Alert.alert("Report Submitted", "Thank you for your report. We will review this content.");
        },
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  }

  if (!job) {
    return (
      <View style={[styles.container, styles.centered]}>
        <EmptyState
          icon="document-outline"
          title="Job not found"
          subtitle="This job may have been removed."
          action={
            <Pressable onPress={() => router.back()}>
              <Text style={styles.linkText}>Go Back</Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  const statusColor = STATUS_COLORS[job.status] || STATUS_COLORS.open;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Job Details</Text>
        {isOwner && job.status === "open" ? (
          <Pressable onPress={handleCancelJob} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
          </Pressable>
        ) : user && !isOwner ? (
          <Pressable onPress={handleReport} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="flag-outline" size={22} color={theme.colors.subtext} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusBadgeLarge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusBadgeLargeText, { color: statusColor.text }]}>
            {job.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Text>
        </View>

        <Text style={styles.jobTitle}>{job.title}</Text>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={16} color={theme.colors.subtext} />
            <Text style={styles.detailText}>{getCategoryLabel(job.categoryId)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={theme.colors.subtext} />
            <Text style={styles.detailText}>${job.budgetMin} – ${job.budgetMax}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.subtext} />
            <Text style={styles.detailText}>{new Date(job.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.descLabel}>Description</Text>
          <Text style={styles.descText}>{job.description}</Text>
        </View>

        <View style={styles.postedByCard}>
          <Ionicons name="person-circle-outline" size={22} color={theme.colors.subtext} />
          <Text style={styles.postedByText}>Posted by {job.customerName}</Text>
        </View>

        {offers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.offersSectionTitle}>
              Offers ({offers.length})
            </Text>
            {offers.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                isOwner={isOwner}
                onAccept={() => handleAcceptOffer(o)}
                onReject={() => handleRejectOffer(o)}
              />
            ))}
          </View>
        )}

        {offers.length === 0 && job.status === "open" && (
          <EmptyState
            icon="people-outline"
            title="No offers yet"
            subtitle="Workers will submit offers once they see your job listing."
          />
        )}
      </ScrollView>

      {user && !isOwner && job.status === "open" && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8) }]}>
          <Pressable
            onPress={() => router.push({ pathname: "/offer-create", params: { jobId: job.id, jobTitle: job.title, customerId: job.customerId } })}
            style={({ pressed }) => [styles.offerBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Ionicons name="hand-left-outline" size={20} color="#fff" />
            <Text style={styles.offerBtnText}>Make an Offer</Text>
          </Pressable>
          <TrustBadgesRow variant="payment" />
        </View>
      )}

      {!user && job.status === "open" && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8) }]}>
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={({ pressed }) => [styles.offerBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.offerBtnText}>Sign in to make an offer</Text>
          </Pressable>
        </View>
      )}

      {isOwner && job.status === "booked" && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8) }]}>
          <Pressable
            onPress={handleCompleteJob}
            style={({ pressed }) => [styles.completeBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.offerBtnText}>Mark Complete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { alignItems: "center", justifyContent: "center", gap: 10 },
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
  statusBadgeLarge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radii.xs,
    marginBottom: 14,
  },
  statusBadgeLargeText: { fontSize: 13, fontFamily: theme.fonts.semibold },
  jobTitle: { fontSize: 24, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 16, letterSpacing: -0.3 },
  detailRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 22 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 14, fontFamily: theme.fonts.medium, color: theme.colors.subtext },
  descriptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
    ...theme.shadow,
  },
  descLabel: { fontSize: 14, fontFamily: theme.fonts.semibold, color: theme.colors.text, marginBottom: 8 },
  descText: { fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.subtext, lineHeight: 23 },
  postedByCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 10,
  },
  postedByText: { fontSize: 14, fontFamily: theme.fonts.medium, color: theme.colors.subtext },
  offersSection: { marginTop: 10 },
  offersSectionTitle: { fontSize: 18, fontFamily: theme.fonts.bold, color: theme.colors.text, marginBottom: 14, letterSpacing: -0.2 },
  offerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    ...theme.shadow,
  },
  offerHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  offerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  offerAvatarText: { fontSize: 17, fontFamily: theme.fonts.bold, color: "#fff" },
  offerName: { fontSize: 15, fontFamily: theme.fonts.semibold, color: theme.colors.text },
  offerEta: { fontSize: 13, fontFamily: theme.fonts.regular, color: theme.colors.subtext, marginTop: 1 },
  offerPrice: { fontSize: 22, fontFamily: theme.fonts.bold, color: theme.colors.primary },
  offerMessage: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.subtext,
    marginTop: 12,
    lineHeight: 21,
  },
  offerActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.success,
    paddingVertical: 13,
    borderRadius: theme.radii.sm,
  },
  acceptText: { fontSize: 14, fontFamily: theme.fonts.bold, color: "#fff" },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.errorLight,
    paddingVertical: 13,
    borderRadius: theme.radii.sm,
  },
  rejectText: { fontSize: 14, fontFamily: theme.fonts.bold, color: theme.colors.error },
  offerStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.xs,
    marginTop: 12,
  },
  offerStatusText: { fontSize: 12, fontFamily: theme.fonts.semibold },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  offerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.radii.button,
  },
  offerBtnText: { fontSize: 16, fontFamily: theme.fonts.bold, color: "#fff", letterSpacing: 0.2 },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.success,
    height: 56,
    borderRadius: theme.radii.button,
  },
  linkText: { fontSize: 14, fontFamily: theme.fonts.semibold, color: theme.colors.primary },
});
