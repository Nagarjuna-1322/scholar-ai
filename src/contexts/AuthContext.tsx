"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: "student";
  provider: "email" | "google-structure" | "local";
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string, migrateLocal?: boolean) => Promise<{ ok: boolean; error?: string }>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    migrateLocal?: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
  signInWithGoogleStructure: (emailHint?: string, migrateLocal?: boolean) => Promise<{ ok: boolean; notice?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => void;
  deleteAccount: () => Promise<{ ok: boolean }>;
}

const AUTH_STORAGE_KEY = "scholarai_auth_user_v2";
const DEFAULT_STUDENT_EMAIL = "mmnagarjunareddy@gmail.com";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        const normalized: AuthUser = { ...parsed, role: "student" };
        setUser(normalized);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
        window.localStorage.setItem("scholarai_active_uid", normalized.userId);
      } else {
        const defaultUser: AuthUser = {
          userId: `acct_${DEFAULT_STUDENT_EMAIL}`,
          email: DEFAULT_STUDENT_EMAIL,
          name: "Nagarjuna Reddy",
          role: "student",
          provider: "local",
        };
        setUser(defaultUser);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
        window.localStorage.setItem("scholarai_active_uid", defaultUser.userId);
      }
    } catch (error) {
      console.error("Failed to load auth session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const collectLocalMigrationPayload = () => {
    if (typeof window === "undefined") return undefined;
    try {
      const profile = JSON.parse(window.localStorage.getItem("scholarai_user_profile_v2") || "null");
      const applications = JSON.parse(window.localStorage.getItem("scholarai_tracked_applications_v2") || "null");
      const reminders = JSON.parse(window.localStorage.getItem("scholarai_scheduled_reminders_v2") || "null");
      const savedIds = JSON.parse(window.localStorage.getItem("scholarai_saved_ids_v2") || "null");
      return { profile, applications, reminders, savedIds };
    } catch {
      return undefined;
    }
  };

  const signInWithEmail = useCallback(
    async (email: string, password: string, migrateLocal = false) => {
      try {
        const res = await fetch("/api/user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "login",
            email,
            password,
            migrateLocalData: migrateLocal ? collectLocalMigrationPayload() : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return { ok: false, error: data.error || "Sign in failed." };
        }
        const authUser: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          name: data.user.name,
          role: "student",
          provider: "email",
        };
        setUser(authUser);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        window.localStorage.setItem("scholarai_active_uid", authUser.userId);
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while signing in." };
      }
    },
    []
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string, migrateLocal = true) => {
      try {
        const res = await fetch("/api/user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register",
            name,
            email,
            password,
            provider: "email",
            migrateLocalData: migrateLocal ? collectLocalMigrationPayload() : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return { ok: false, error: data.error || "Registration failed." };
        }
        const authUser: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          name: data.user.name,
          role: "student",
          provider: "email",
        };
        setUser(authUser);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        window.localStorage.setItem("scholarai_active_uid", authUser.userId);
        return { ok: true };
      } catch {
        return { ok: false, error: "Network error while creating account." };
      }
    },
    []
  );

  const signInWithGoogleStructure = useCallback(
    async (emailHint?: string, migrateLocal = true) => {
      const targetEmail = (emailHint || DEFAULT_STUDENT_EMAIL).trim().toLowerCase();
      const res = await fetch("/api/user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          name: targetEmail === DEFAULT_STUDENT_EMAIL ? "Nagarjuna Reddy" : targetEmail.split("@")[0],
          email: targetEmail,
          provider: "google-structure",
          migrateLocalData: migrateLocal ? collectLocalMigrationPayload() : undefined,
        }),
      });
      const data = await res.json();
      if (data?.user) {
        const authUser: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          name: data.user.name,
          role: "student",
          provider: "google-structure",
        };
        setUser(authUser);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        window.localStorage.setItem("scholarai_active_uid", authUser.userId);
      }
      return {
        ok: true,
        notice: "Signed in and synced with your ScholarAI student account.",
      };
    },
    []
  );

  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    try {
      const res = await fetch("/api/user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", email, newPassword }),
      });
      const data = await res.json();
      return { ok: Boolean(data.ok), message: data.message || "Password updated." };
    } catch {
      return { ok: false, message: "Failed to reset password." };
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.localStorage.setItem("scholarai_active_uid", "guest-student");
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    const uid = user?.userId || "local-student";
    try {
      await fetch(`/api/user-data?userId=${encodeURIComponent(uid)}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Account delete server error:", e);
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.localStorage.removeItem("scholarai_user_profile_v2");
      window.localStorage.removeItem("scholarai_tracked_applications_v2");
      window.localStorage.removeItem("scholarai_scheduled_reminders_v2");
      window.localStorage.removeItem("scholarai_saved_ids_v2");
      window.localStorage.removeItem("scholarai_compare_ids_v2");
    }
    setUser(null);
    return { ok: true };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        signInWithEmail,
        registerWithEmail,
        signInWithGoogleStructure,
        resetPassword,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
