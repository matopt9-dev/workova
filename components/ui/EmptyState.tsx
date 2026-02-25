import { View, Text, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./theme";

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ icon, title, subtitle, action, style }: Props) {
  return (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 56,
          paddingHorizontal: theme.spacing.xl,
          gap: 10,
        },
        style,
      ]}
    >
      {icon && (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: theme.colors.surfaceSecondary,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <Ionicons name={icon as any} size={28} color={theme.colors.muted} />
        </View>
      )}
      <Text
        style={{
          fontSize: 17,
          fontFamily: theme.fonts.bold,
          color: theme.colors.text,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: theme.fonts.regular,
            color: theme.colors.subtext,
            textAlign: "center",
            lineHeight: 21,
            maxWidth: 280,
          }}
        >
          {subtitle}
        </Text>
      )}
      {action && <View style={{ marginTop: 12 }}>{action}</View>}
    </View>
  );
}
