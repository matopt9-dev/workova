import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform, RefreshControl, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService, Chat } from "@/lib/storage";
import { theme } from "@/components/ui/theme";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/Button";

function ChatListItem({ chat, userId }: { chat: Chat; userId: string }) {
  const otherMemberId = chat.members.find((m) => m !== userId) || "";
  const otherName = chat.memberNames[otherMemberId] || "Unknown";
  const initial = otherName.charAt(0).toUpperCase();
  const timeAgo = getTimeAgo(chat.updatedAt);
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => router.push({ pathname: "/chat/[id]", params: { id: chat.id } })}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        style={styles.chatItem}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatTopRow}>
            <Text style={styles.chatName} numberOfLines={1}>{otherName}</Text>
            <Text style={styles.chatTime}>{timeAgo}</Text>
          </View>
          <Text style={styles.chatJobTitle} numberOfLines={1}>{chat.jobTitle}</Text>
          <Text style={styles.chatLastMsg} numberOfLines={1}>
            {chat.lastMessage || "No messages yet"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} style={{ alignSelf: "center" }} />
      </Pressable>
    </Animated.View>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<Chat[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    if (!user) return;
    const c = await StorageService.getChatsForUser(user.id);
    setChats(c);
  }, [user?.id]);

  useEffect(() => { loadChats(); }, [loadChats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, [loadChats]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to view messages"
          subtitle="Your conversations with workers and customers will appear here."
          action={
            <PrimaryButton title="Sign In" onPress={() => router.push("/(auth)/login")} style={{ paddingHorizontal: 40 }} />
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 14 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={chats}
        renderItem={({ item }) => <ChatListItem chat={item} userId={user.id} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No messages yet"
            subtitle="When you connect with workers or customers about a job, your conversations will appear here."
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { fontSize: 24, fontFamily: theme.fonts.bold, color: theme.colors.text, letterSpacing: -0.3 },
  list: { paddingTop: 4 },
  chatItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontFamily: theme.fonts.bold, color: "#fff" },
  chatContent: { flex: 1, justifyContent: "center" },
  chatTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chatName: { fontSize: 16, fontFamily: theme.fonts.semibold, color: theme.colors.text, flex: 1 },
  chatTime: { fontSize: 12, fontFamily: theme.fonts.regular, color: theme.colors.muted },
  chatJobTitle: { fontSize: 13, fontFamily: theme.fonts.semibold, color: theme.colors.primary, marginTop: 2 },
  chatLastMsg: { fontSize: 14, fontFamily: theme.fonts.regular, color: theme.colors.subtext, marginTop: 2 },
});
