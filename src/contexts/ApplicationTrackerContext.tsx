"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type ApplicationStatus = "Applied" | "Interviewing" | "Awarded";

export interface ApplicationRecord {
  scholarshipId: number;
  status: ApplicationStatus;
  updatedAt: string; // ISO date string
  notes?: string;
}

interface ApplicationTrackerContextType {
  applications: Record<number, ApplicationRecord>;
  getStatus: (scholarshipId: number) => ApplicationStatus | null;
  getRecord: (scholarshipId: number) => ApplicationRecord | null;
  setStatus: (scholarshipId: number, status: ApplicationStatus | null, notes?: string) => void;
  removeStatus: (scholarshipId: number) => void;
  clearAll: () => void;
}

const ApplicationTrackerContext = createContext<ApplicationTrackerContextType | undefined>(undefined);

const STORAGE_KEY = "scholarai_application_tracker";

export function ApplicationTrackerProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Record<number, ApplicationRecord>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
          setApplications(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load application tracker data from localStorage:", error);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when applications change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch (error) {
      console.error("Failed to save application tracker data to localStorage:", error);
    }
  }, [applications, isInitialized]);

  const getStatus = useCallback(
    (scholarshipId: number): ApplicationStatus | null => {
      return applications[scholarshipId]?.status ?? null;
    },
    [applications]
  );

  const getRecord = useCallback(
    (scholarshipId: number): ApplicationRecord | null => {
      return applications[scholarshipId] ?? null;
    },
    [applications]
  );

  const setStatus = useCallback(
    (scholarshipId: number, status: ApplicationStatus | null, notes?: string) => {
      setApplications((prev) => {
        const next = { ...prev };
        if (!status) {
          delete next[scholarshipId];
        } else {
          next[scholarshipId] = {
            scholarshipId,
            status,
            updatedAt: new Date().toISOString(),
            notes: notes ?? prev[scholarshipId]?.notes,
          };
        }
        return next;
      });
    },
    []
  );

  const removeStatus = useCallback((scholarshipId: number) => {
    setApplications((prev) => {
      const next = { ...prev };
      delete next[scholarshipId];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setApplications({});
  }, []);

  return (
    <ApplicationTrackerContext.Provider
      value={{
        applications,
        getStatus,
        getRecord,
        setStatus,
        removeStatus,
        clearAll,
      }}
    >
      {children}
    </ApplicationTrackerContext.Provider>
  );
}

export function useApplicationTracker() {
  const context = useContext(ApplicationTrackerContext);
  if (!context) {
    throw new Error("useApplicationTracker must be used within an ApplicationTrackerProvider");
  }
  return context;
}
