export type JobCategory = {
  id: string;
  label: string;
  icon: string;
  iconFamily: "Ionicons" | "MaterialCommunityIcons" | "Feather" | "MaterialIcons";
};

export const JOB_CATEGORIES: JobCategory[] = [
  { id: "handyman", label: "Handyman", icon: "hammer-outline", iconFamily: "Ionicons" },
  { id: "cleaning", label: "Cleaning", icon: "sparkles-outline", iconFamily: "Ionicons" },
  { id: "hvac", label: "HVAC", icon: "thermometer-outline", iconFamily: "Ionicons" },
  { id: "remodeling", label: "Remodeling", icon: "construct-outline", iconFamily: "Ionicons" },
  { id: "moving", label: "Moving", icon: "cube-outline", iconFamily: "Ionicons" },
  { id: "tutoring", label: "Tutoring", icon: "school-outline", iconFamily: "Ionicons" },
  { id: "babysitting", label: "Babysitting", icon: "people-outline", iconFamily: "Ionicons" },
  { id: "plumbing", label: "Plumbing", icon: "water-outline", iconFamily: "Ionicons" },
];

export function getCategoryById(id: string): JobCategory | undefined {
  return JOB_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label || id;
}
