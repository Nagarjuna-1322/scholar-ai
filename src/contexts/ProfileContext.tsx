"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

export type UserProfile = {
  name: string;
  fullName?: string;
  email?: string;
  course: string;
  specialization?: string;
  education_level?: string;
  academic_year?: string;
  institution?: string;
  state?: string;
  income: number | null;
  category: string;
  marks_percent: number | null;
  cgpa?: number | null;
  gender?: "Female" | "Male" | "Other" | "Prefer not to say" | "Any" | string;
  is_specially_abled?: boolean;
  is_armed_forces_ward?: boolean;
  career_interests?: string[] | string;
  completed_documents?: string[];
  preferred_language?: "en" | "hi" | "te";
  consent_given?: boolean;
};

interface ProfileContextType {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (fields: Partial<UserProfile>) => void;
  updateProfileFields: (fields: Partial<UserProfile>) => void;
  toggleDocumentCompleted: (docName: string) => void;
  isProfileOpen: boolean;
  setProfileOpen: (isOpen: boolean) => void;
  completionPercentage: number;
  missingFields: string[];
  missingProfileFields: string[];
  isSyncedWithServer: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const defaultProfile: UserProfile = {
  name: "",
  email: "",
  course: "Engineering",
  specialization: "Computer Science & Engineering",
  education_level: "Undergraduate",
  academic_year: "1st Year",
  institution: "",
  state: "Telangana",
  income: 220000,
  category: "OBC",
  marks_percent: 82,
  cgpa: 8.4,
  gender: "Female",
  is_specially_abled: false,
  is_armed_forces_ward: false,
  career_interests: ["Software Engineering", "AI & Data Science"],
  completed_documents: [
    "Class 10 & Class 12 / Diploma Mark Sheets",
    "Family Income Certificate (≤ ₹4.5 Lakh/year)",
    "Aadhaar-seeded Bank Account Passbook",
  ],
  preferred_language: "en",
  consent_given: true,
};

export function computeProfileCompletion(p: UserProfile): {
  percentage: number;
  missingFields: string[];
} {
  const checks: Array<{ label: string; valid: boolean }> = [
    { label: "Full Name", valid: Boolean(p.name && p.name.trim().length > 1) },
    { label: "Course / Stream", valid: Boolean(p.course && p.course.trim().length > 0) },
    { label: "Education Level", valid: Boolean(p.education_level) },
    { label: "Academic Year", valid: Boolean(p.academic_year) },
    { label: "College / Institution", valid: Boolean(p.institution && p.institution.trim().length > 1) },
    { label: "State of Residence", valid: Boolean(p.state && p.state.trim().length > 0) },
    { label: "Academic Marks (%)", valid: typeof p.marks_percent === "number" && p.marks_percent > 0 },
    { label: "Annual Family Income", valid: typeof p.income === "number" && p.income >= 0 },
    { label: "Scholarship Category", valid: Boolean(p.category) },
    { label: "Gender", valid: Boolean(p.gender) },
  ];

  const completed = checks.filter((c) => c.valid).length;
  const missingFields = checks.filter((c) => !c.valid).map((c) => c.label);
  const percentage = Math.round((completed / checks.length) * 100);

  return { percentage, missingFields };
}

const STORAGE_KEY = "scholarai_profile_v2";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isInitialized, setInitialized] = useState(false);
  const [isSyncedWithServer, setIsSyncedWithServer] = useState(false);

  useEffect(() => {
    try {
      const storedV2 = localStorage.getItem(STORAGE_KEY);
      const storedLegacy = localStorage.getItem("scholarai_profile");
      if (storedV2) {
        const parsed = JSON.parse(storedV2);
        setProfileState({ ...defaultProfile, ...parsed });
      } else if (storedLegacy) {
        const parsed = JSON.parse(storedLegacy);
        setProfileState({ ...defaultProfile, ...parsed });
      }
    } catch (error) {
      console.error("Failed to parse profile from localStorage", error);
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        localStorage.setItem("scholarai_profile", JSON.stringify(profile));
      } catch (error) {
        console.error("Failed to save profile to localStorage", error);
      }

      // Sync with server-side persistent store
      fetch("/api/user-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "profile", data: profile }),
      })
        .then((res) => {
          if (res.ok) setIsSyncedWithServer(true);
        })
        .catch(() => {
          // Offline fallback remains in localStorage
        });
    }
  }, [profile, isInitialized]);

  const setProfile = useCallback((newProfile: UserProfile) => {
    setProfileState(newProfile);
  }, []);

  const updateProfileFields = useCallback((fields: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...fields }));
  }, []);

  const toggleDocumentCompleted = useCallback((docName: string) => {
    setProfileState((prev) => {
      const current = prev.completed_documents || [];
      const exists = current.includes(docName);
      const next = exists
        ? current.filter((d) => d !== docName)
        : [...current, docName];
      return { ...prev, completed_documents: next };
    });
  }, []);

  const { percentage: completionPercentage, missingFields: missingProfileFields } =
    useMemo(() => computeProfileCompletion(profile), [profile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile: updateProfileFields,
        updateProfileFields,
        toggleDocumentCompleted,
        isProfileOpen,
        setProfileOpen,
        completionPercentage,
        missingFields: missingProfileFields,
        missingProfileFields,
        isSyncedWithServer,
      }}
    >
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
