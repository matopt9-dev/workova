import { useRef, useCallback } from "react";
import { Pressable, Text, Animated, ActivityIndicator, ViewStyle, StyleProp, TextStyle } from "react-native";
import { theme } from "./theme";

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
};

export function PrimaryButton({ title, onPress, disabled, loading, icon, style, textStyle, testID }: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={[
          {
            backgroundColor: theme.colors.primary,
            height: 56,
            borderRadius: theme.radii.button,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            flexDirection: "row" as const,
            gap: 8,
            opacity: disabled ? 0.55 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon}
            <Text
              style={[
                {
                  color: "#fff",
                  fontSize: 16,
                  fontFamily: theme.fonts.bold,
                  letterSpacing: 0.2,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function SecondaryButton({ title, onPress, disabled, loading, icon, style, textStyle }: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
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
        disabled={disabled || loading}
        style={[
          {
            height: 56,
            borderRadius: theme.radii.button,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            flexDirection: "row" as const,
            gap: 8,
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
            backgroundColor: "transparent",
            opacity: disabled ? 0.55 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                {
                  color: theme.colors.primary,
                  fontSize: 16,
                  fontFamily: theme.fonts.bold,
                  letterSpacing: 0.2,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
