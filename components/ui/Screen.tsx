import { View, Platform, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "./theme";

type Props = {
  children: React.ReactNode;
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, noPadding, style }: Props) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.bg,
          paddingHorizontal: noPadding ? 0 : theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
