import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useAuth } from "@/contexts/AuthContext";
import { StorageService, Chat, Message, Report } from "@/lib/storage";
import { theme } from "@/components/ui/theme";

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && <Text style={styles.bubbleSender}>{message.senderName}</Text>}
        <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{message.text}</Text>
        <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>{time}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    const [c, m] = await Promise.all([
      StorageService.getChatById(id),
      StorageService.getMessagesForChat(id),
    ]);
    setChat(c);
    setMessages(m.reverse());
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  async function handleSend() {
    if (!text.trim() || !user || !chat) return;
    const msg: Message = {
      id: Crypto.randomUUID(),
      chatId: chat.id,
      senderId: user.id,
      senderName: user.displayName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages((prev) => [msg, ...prev]);
    await StorageService.createMessage(msg);
    await StorageService.updateChat(chat.id, {
      lastMessage: msg.text,
      updatedAt: msg.createdAt,
    });
    inputRef.current?.focus();
  }

  const otherMemberId = chat ? chat.members.find((m) => m !== user?.id) || "" : "";
  const otherName = chat ? chat.memberNames[otherMemberId] || "Chat" : "Chat";

  async function handleBlockUser() {
    if (!user || !otherMemberId) return;
    Alert.alert(
      "Block User",
      `Block ${otherName}? Their jobs and content will be hidden from your feed and you will no longer be able to message them.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await StorageService.blockUser(user.id, otherMemberId);
            const report: Report = {
              id: Crypto.randomUUID(),
              reporterId: user.id,
              targetType: "user" as const,
              targetId: otherMemberId,
              reason: "Blocked by user",
              createdAt: new Date().toISOString(),
            };
            await StorageService.createReport(report);
            await refreshUser();
            Alert.alert("User Blocked", `${otherName} has been blocked. Their content has been removed from your feed.`);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={0}>
      <View style={[styles.header, { paddingTop: (Platform.OS !== "web" ? insets.top : 0) + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherName}</Text>
          {chat && <Text style={styles.headerJob}>{chat.jobTitle}</Text>}
        </View>
        <Pressable onPress={handleBlockUser} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })} testID="chat.block">
          <Ionicons name="ban-outline" size={22} color={theme.colors.subtext} />
        </Pressable>
      </View>

      <FlatList
        data={messages}
        inverted
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.senderId === user?.id} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <View style={styles.emptyChatIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color={theme.colors.muted} />
            </View>
            <Text style={styles.emptyChatText}>Start the conversation</Text>
            <Text style={styles.emptyChatSub}>Messages are private between you and this person</Text>
          </View>
        }
        scrollEnabled={true}
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8) }]}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.muted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!text.trim()}
          style={({ pressed }) => [styles.sendBtn, { opacity: !text.trim() ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.93 : 1 }] }]}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 17, fontFamily: theme.fonts.bold, color: theme.colors.text },
  headerJob: { fontSize: 13, fontFamily: theme.fonts.semibold, color: theme.colors.primary, marginTop: 1 },
  messagesList: { padding: 16, gap: 4 },
  bubbleRow: { flexDirection: "row", marginBottom: 6 },
  bubbleRowOwn: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "78%",
    padding: 13,
    borderRadius: theme.radii.card,
  },
  bubbleOwn: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadowLight,
  },
  bubbleSender: { fontSize: 12, fontFamily: theme.fonts.semibold, color: theme.colors.primary, marginBottom: 2 },
  bubbleText: { fontSize: 15, fontFamily: theme.fonts.regular, color: theme.colors.text, lineHeight: 21 },
  bubbleTextOwn: { color: "#fff" },
  bubbleTime: { fontSize: 11, fontFamily: theme.fonts.regular, color: theme.colors.muted, marginTop: 4, textAlign: "right" },
  bubbleTimeOwn: { color: "rgba(255,255,255,0.7)" },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 60,
    transform: [{ scaleY: -1 }],
  },
  emptyChatIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyChatText: { fontSize: 16, fontFamily: theme.fonts.bold, color: theme.colors.text },
  emptyChatSub: { fontSize: 13, fontFamily: theme.fonts.regular, color: theme.colors.muted },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
