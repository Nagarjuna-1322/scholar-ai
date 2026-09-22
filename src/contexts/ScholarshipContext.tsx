"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import {
  Scholarship,
  ExpiredScholarshipRecord,
  sampleScholarships,
  initialExpiredScholarships,
  rawInitialScholarships,
  updateScholarshipCatalog,
  replacementScholarships,
  newlyPublishedScholarships,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

interface ScholarshipContextType {
  scholarships: Scholarship[];
  expiredArchive: ExpiredScholarshipRecord[];
  newlyPublished: Scholarship[];
  lastCheckedTime: string | null;
  hasNewAlert: boolean;
  isUpdateModalOpen: boolean;
  setUpdateModalOpen: (open: boolean) => void;
  checkForUpdates: (manual?: boolean) => { expiredRemoved: number; newAdded: number };
  publishScholarship: (newScheme: Omit<Scholarship, "id" | "isNew" | "publishedAt">) => Scholarship;
  dismissNewAlert: () => void;
  getScholarshipById: (id: number) => Scholarship | undefined;
  stats: {
    totalActive: number;
    newlyPublishedCount: number;
    expiredReplacedCount: number;
    govtCount: number;
    privateCount: number;
  };
}

const ScholarshipContext = createContext<ScholarshipContextType | undefined>(undefined);

const STORAGE_SCHOLARSHIPS_KEY = "scholarai_active_scholarships_v4";
const STORAGE_EXPIRED_KEY = "scholarai_expired_archive_v4";
const STORAGE_LAST_CHECK_KEY = "scholarai_last_check_v4";

// Utility to get current local date string (YYYY-MM-DD)
function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ScholarshipProvider({ children }: { children: ReactNode }) {
  const [scholarships, setScholarships] = useState<Scholarship[]>(sampleScholarships);
  const [expiredArchive, setExpiredArchive] = useState<ExpiredScholarshipRecord[]>(initialExpiredScholarships);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [hasNewAlert, setHasNewAlert] = useState<boolean>(true);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { toast } = useToast();

  // Core update cycle logic
  const runUpdateCycle = useCallback(
    (currentList: Scholarship[], currentExpired: ExpiredScholarshipRecord[], manual: boolean = false) => {
      const todayStr = getCurrentDateString();
      const updatedExpired = [...currentExpired];
      const activeMap = new Map<number, Scholarship>();
      let expiredCount = 0;
      let newAddedCount = 0;

      // 1. Scan current list for expired items
      for (const item of currentList) {
        if (item.deadline < todayStr) {
          // It is expired! Remove it and archive it
          expiredCount++;
          const replacement = replacementScholarships[item.id];
          const alreadyArchived = updatedExpired.some((e) => e.expiredId === item.id);

          if (!alreadyArchived) {
            updatedExpired.unshift({
              expiredId: item.id,
              expiredTitle: item.title,
              provider: item.provider,
              originalDeadline: item.deadline,
              category: item.category,
              replacementId: replacement?.id,
              replacementTitle: replacement?.title,
              retiredOn: todayStr,
              reason: `Deadline of ${item.deadline} has lapsed. Automatically replaced by current active cycle.`,
            });
          }

          // Insert replacement if available
          if (replacement && !activeMap.has(replacement.id)) {
            activeMap.set(replacement.id, { ...replacement, isNew: true });
            newAddedCount++;
          }
        } else {
          activeMap.set(item.id, item);
        }
      }

      // 2. Scan catalog for freshly published scholarships that aren't present yet
      for (const fresh of newlyPublishedScholarships) {
        if (fresh.deadline >= todayStr && !activeMap.has(fresh.id)) {
          activeMap.set(fresh.id, { ...fresh, isNew: true });
          newAddedCount++;
        }
      }

      const finalizedList = Array.from(activeMap.values()).sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      setScholarships(finalizedList);
      setExpiredArchive(updatedExpired);
      const timeStamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastCheckedTime(timeStamp);

      if (manual || expiredCount > 0 || newAddedCount > 0) {
        setHasNewAlert(true);
      }

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_SCHOLARSHIPS_KEY, JSON.stringify(finalizedList));
        localStorage.setItem(STORAGE_EXPIRED_KEY, JSON.stringify(updatedExpired));
        localStorage.setItem(STORAGE_LAST_CHECK_KEY, timeStamp);
      } catch (e) {
        console.error("Failed saving to localStorage:", e);
      }

      if (manual) {
        toast({
          title: "Scholarship Directory Up to Date",
          description: `Checked against current deadlines. ${finalizedList.length} active scholarships available (${finalizedList.filter((s) => s.isNew).length} newly published).`,
        });
      }

      return { expiredRemoved: expiredCount, newAdded: newAddedCount };
    },
    [toast]
  );

  // Initialize from storage or default on mount
  useEffect(() => {
    let initialList = sampleScholarships;
    let initialExp = initialExpiredScholarships;

    try {
      const storedScholarships = localStorage.getItem(STORAGE_SCHOLARSHIPS_KEY);
      const storedExpired = localStorage.getItem(STORAGE_EXPIRED_KEY);
      const storedLastCheck = localStorage.getItem(STORAGE_LAST_CHECK_KEY);

      if (storedScholarships) {
        const parsed = JSON.parse(storedScholarships);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = parsed;
        }
      }
      if (storedExpired) {
        const parsedExp = JSON.parse(storedExpired);
        if (Array.isArray(parsedExp)) {
          initialExp = parsedExp;
        }
      }
      if (storedLastCheck) {
        setLastCheckedTime(storedLastCheck);
      }
    } catch (e) {
      console.error("Error reading stored scholarships:", e);
    }

    // Run dynamic evaluation on mount to purge any newly expired scholarships
    runUpdateCycle(initialList, initialExp, false);
    setIsInitialized(true);
  }, [runUpdateCycle]);

  // Manual check for updates
  const checkForUpdates = useCallback(
    (manual: boolean = true) => {
      return runUpdateCycle(scholarships, expiredArchive, manual);
    },
    [runUpdateCycle, scholarships, expiredArchive]
  );

  // Publish a new scholarship dynamically
  const publishScholarship = useCallback(
    (newScheme: Omit<Scholarship, "id" | "isNew" | "publishedAt">): Scholarship => {
      const todayStr = getCurrentDateString();
      const newId = Date.now();
      const createdScholarship: Scholarship = {
        ...newScheme,
        id: newId,
        isNew: true,
        publishedAt: todayStr,
      };

      setScholarships((prev) => {
        const updated = [createdScholarship, ...prev];
        try {
          localStorage.setItem(STORAGE_SCHOLARSHIPS_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error("Failed saving new scholarship to localStorage:", e);
        }
        return updated;
      });

      setHasNewAlert(true);

      toast({
        title: "🎉 New Scholarship Published!",
        description: `"${newScheme.title}" is now live and published to all students.`,
      });

      return createdScholarship;
    },
    [toast]
  );

  const dismissNewAlert = useCallback(() => {
    setHasNewAlert(false);
  }, []);

  const getScholarshipById = useCallback(
    (id: number): Scholarship | undefined => {
      // Look in active
      const found = scholarships.find((s) => s.id === id);
      if (found) return found;

      // Look in raw catalog
      const rawFound = rawInitialScholarships.find((s) => s.id === id);
      if (rawFound) return rawFound;

      // Look in replacement pool
      const replFound = Object.values(replacementScholarships).find((s) => s.id === id);
      if (replFound) return replFound;

      return undefined;
    },
    [scholarships]
  );

  // Computed values
  const newlyPublished = useMemo(() => {
    return scholarships.filter((s) => s.isNew);
  }, [scholarships]);

  const stats = useMemo(() => {
    return {
      totalActive: scholarships.length,
      newlyPublishedCount: scholarships.filter((s) => s.isNew).length,
      expiredReplacedCount: expiredArchive.length,
      govtCount: scholarships.filter((s) => s.category === "Government").length,
      privateCount: scholarships.filter((s) => s.category === "Private").length,
    };
  }, [scholarships, expiredArchive]);

  const value = useMemo(
    () => ({
      scholarships,
      expiredArchive,
      newlyPublished,
      lastCheckedTime,
      hasNewAlert,
      isUpdateModalOpen,
      setUpdateModalOpen,
      checkForUpdates,
      publishScholarship,
      dismissNewAlert,
      getScholarshipById,
      stats,
    }),
    [
      scholarships,
      expiredArchive,
      newlyPublished,
      lastCheckedTime,
      hasNewAlert,
      isUpdateModalOpen,
      checkForUpdates,
      publishScholarship,
      dismissNewAlert,
      getScholarshipById,
      stats,
    ]
  );

  return <ScholarshipContext.Provider value={value}>{children}</ScholarshipContext.Provider>;
}

export function useScholarships() {
  const context = useContext(ScholarshipContext);
  if (!context) {
    throw new Error("useScholarships must be used within a ScholarshipProvider");
  }
  return context;
}
