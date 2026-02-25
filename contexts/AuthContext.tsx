import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import * as Crypto from "expo-crypto";
import { StorageService, AuthUser } from "@/lib/storage";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  updateRole: (role: "customer" | "worker" | "both") => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await StorageService.getAuthUser();
        setUser(saved);
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, _password: string) => {
    const existing = await StorageService.findUserByEmail(email.toLowerCase().trim());
    if (!existing) {
      throw new Error("No account found with that email. Please sign up first.");
    }
    await StorageService.setAuthUser(existing);
    setUser(existing);
  };

  const signUp = async (email: string, _password: string, displayName: string) => {
    const existing = await StorageService.findUserByEmail(email.toLowerCase().trim());
    if (existing) {
      throw new Error("An account with that email already exists.");
    }
    const newUser: AuthUser = {
      id: Crypto.randomUUID(),
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      role: "customer",
      blockedUsers: [],
      createdAt: new Date().toISOString(),
    };
    await StorageService.setAuthUser(newUser);
    setUser(newUser);
  };

  const signOut = async () => {
    await StorageService.setAuthUser(null);
    setUser(null);
  };

  const signInAsDemo = async () => {
    await StorageService.seedDemoData();
    const demoUser = await StorageService.getUserById("demo-user-1");
    if (demoUser) {
      await StorageService.setAuthUser(demoUser);
      setUser(demoUser);
    }
  };

  const updateRole = async (role: "customer" | "worker" | "both") => {
    if (!user) return;
    const updated = { ...user, role };
    await StorageService.setAuthUser(updated);
    setUser(updated);
  };

  const refreshUser = async () => {
    const saved = await StorageService.getAuthUser();
    setUser(saved);
  };

  const value = useMemo(
    () => ({ user, isLoading, signIn, signUp, signOut, signInAsDemo, updateRole, refreshUser }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
