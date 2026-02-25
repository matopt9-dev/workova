import { View, ViewStyle, StyleProp } from "react-native";
import { theme } from "./theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
};

export function Card({ children, style, noPadding }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: noPadding ? 0 : theme.spacing.lg,
          ...theme.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
