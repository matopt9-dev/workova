import { Platform, StyleSheet } from "react-native";

export const theme = {
  colors: {
    bg: "#F7F8FA",
    surface: "#FFFFFF",
    surfaceSecondary: "#F1F5F9",
    text: "#0B0F1A",
    subtext: "rgba(11,15,26,0.65)",
    muted: "rgba(11,15,26,0.4)",
    border: "rgba(0,0,0,0.05)",
    borderSolid: "#E8EAF0",
    primary: "#0D9488",
    primaryLight: "#14B8A6",
    primaryDark: "#0F766E",
    primarySurface: "rgba(13,148,136,0.08)",
    accent: "#F59E0B",
    success: "#10B981",
    successLight: "#ECFDF5",
    error: "#EF4444",
    errorLight: "#FEF2F2",
    info: "#3B82F6",
    warning: "#F59E0B",
    overlay: "rgba(15, 23, 42, 0.5)",
  },
  radii: {
    xs: 8,
    sm: 12,
    card: 18,
    button: 16,
    tile: 20,
    full: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  shadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
  }) as any,
  shadowLight: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    android: {
      elevation: 1,
    },
    default: {
      shadowColor: "#000",
      shadowOpacity: 0.02,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
  }) as any,
  fonts: {
    regular: "DMSans_400Regular",
    medium: "DMSans_500Medium",
    semibold: "DMSans_600SemiBold",
    bold: "DMSans_700Bold",
  },
};

export const cardStyle = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow,
  },
});
