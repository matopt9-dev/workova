import { useRef, useCallback } from "react";
import { Pressable, Text, Animated, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./theme";

type Props = {
  icon: string;
  label: string;
  onPress: () => void;
};

export function ServiceIconTile({ icon, label, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{
          width: 84,
          alignItems: "center",
          gap: 8,
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: theme.radii.tile,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadowLight,
          }}
        >
          <Ionicons name={icon as any} size={26} color={theme.colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 12,
            fontFamily: theme.fonts.semibold,
            color: theme.colors.subtext,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
