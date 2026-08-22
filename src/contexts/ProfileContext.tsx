"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserProfile = {
  name: string;
  course: string;
  income: number;
  category: string;
  marks_percent: number;
};

interface ProfileContextType {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  isProfileOpen: boolean;
  setProfileOpen: (isOpen: boolean) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const defaultProfile: UserProfile = {
  name: "",
  course: "Bachelors",
  income: 300000,
  category: "General",
  marks_percent: 75,
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isInitialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("scholarai_profile");
      if (stored) {
        setProfileState(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to parse profile from localStorage", error);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("scholarai_profile", JSON.stringify(profile));
      } catch (error) {
        console.error("Failed to save profile to localStorage", error);
      }
    }
  }, [profile, isInitialized]);

  const setProfile = (newProfile: UserProfile) => {
    setProfileState(newProfile);
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile, isProfileOpen, setProfileOpen }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
