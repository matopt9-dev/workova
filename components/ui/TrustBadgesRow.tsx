import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./theme";

type Variant = "auth" | "payment" | "provider";

const BADGES: Record<Variant, { icon: string; text: string }[]> = {
  auth: [
    { icon: "shield-checkmark-outline", text: "Secure sign-in" },
    { icon: "people-outline", text: "Verified professionals" },
    { icon: "lock-closed-outline", text: "Your data is protected" },
  ],
  payment: [
    { icon: "card-outline", text: "Payments secured" },
    { icon: "shield-checkmark-outline", text: "Verified professionals" },
    { icon: "chatbubble-ellipses-outline", text: "Safe & reliable hiring" },
  ],
  provider: [
    { icon: "wallet-outline", text: "Fast payouts" },
    { icon: "shield-checkmark-outline", text: "Verified background checks" },
    { icon: "star-outline", text: "Build your reputation" },
  ],
};

type Props = {
  variant?: Variant;
};

export function TrustBadgesRow({ variant = "auth" }: Props) {
  const items = BADGES[variant];
  return (
    <View style={{ gap: 10, paddingVertical: 16, alignItems: "center" }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name={item.icon as any} size={14} color={theme.colors.muted} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: theme.fonts.medium,
              color: theme.colors.muted,
              letterSpacing: 0.1,
            }}
          >
            {item.text}
          </Text>
        </View>
      ))}
    </View>
  );
}
