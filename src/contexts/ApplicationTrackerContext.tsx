"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

/**
 * All 10 required application lifecycle stages from Module 6,
 * plus legacy aliases ('Applied', 'Interviewing') mapped seamlessly.
 */
export type ApplicationStatus =
  | "Saved"
  | "Preparing Documents"
  | "Ready to Apply"
  | "Application Started"
  | "Submitted"
  | "Under Review"
  | "Shortlisted / Interview"
  | "Awarded"
  | "Rejected"
  | "Withdrawn"
  | "Applied"
  | "Interviewing";

export const APPLICATION_STAGES_ORDER: ApplicationStatus[] = [
  "Saved",
  "Preparing Documents",
  "Ready to Apply",
  "Application Started",
  "Submitted",
  "Under Review",
  "Shortlisted / Interview",
  "Awarded",
  "Rejected",
  "Withdrawn",
];

export const ALL_APPLICATION_STATUSES: ApplicationStatus[] = APPLICATION_STAGES_ORDER;

export interface ApplicationHistoryEntry {
  status: ApplicationStatus;
  timestamp: string;
  note?: string;
}

export interface ScheduledReminderRecord {
  scholarshipId: number | string;
  scholarshipTitle: string;
  deadline: string;
  intervalsDays: number[]; // e.g. [7, 3, 1]
  emailEnabled?: boolean;
  browserPushEnabled?: boolean;
  inAppEnabled?: boolean;
  channels: {
    inApp: boolean;
    browserPush: boolean;
    calendarExported: boolean;
  };
  createdAt: string;
  active: boolean;
}

export interface ApplicationRecord {
  scholarshipId: number | string;
  scholarshipTitle?: string;
  status: ApplicationStatus;
  updatedAt: string; // ISO date string
  notes?: string;
  applicationReferenceId?: string;
  submissionDate?: string;
  completedDocuments?: string[];
  submissionConfirmationReceipt?: string;
  verificationState?: "Student Self-Reported" | "Portal Receipt Attached";
  historyLog?: ApplicationHistoryEntry[];
}

interface ApplicationTrackerContextType {
  applications: Record<string, ApplicationRecord>;
  reminders: ScheduledReminderRecord[];
  remindersMap: Record<string, ScheduledReminderRecord>;
  getStatus: (scholarshipId: number | string) => ApplicationStatus | null;
  getRecord: (scholarshipId: number | string) => ApplicationRecord | null;
  getReminder: (scholarshipId: number | string) => ScheduledReminderRecord | undefined;
  setStatus: (
    scholarshipId: number | string,
    status: ApplicationStatus | null,
    notes?: string,
    extra?: Partial<ApplicationRecord>
  ) => void;
  updateApplicationDetails: (
    scholarshipId: number | string,
    updates: Partial<ApplicationRecord>
  ) => void;
  toggleApplicationDocument: (
    scholarshipId: number | string,
    docName: string,
    scholarshipTitle?: string
  ) => void;
  toggleCompletedDocument: (
    scholarshipId: number | string,
    docName: string,
    scholarshipTitle?: string
  ) => void;
  scheduleReminder: (
    record: Omit<ScheduledReminderRecord, "createdAt" | "active" | "channels"> & {
      createdAt?: string;
      active?: boolean;
      channels?: {
        inApp: boolean;
        browserPush: boolean;
        calendarExported: boolean;
      };
    }
  ) => void;
  cancelReminder: (scholarshipId: number | string) => void;
  removeStatus: (scholarshipId: number | string) => void;
  clearAll: () => void;
}

const ApplicationTrackerContext = createContext<
  ApplicationTrackerContextType | undefined
>(undefined);

const STORAGE_KEY = "scholarai_application_tracker_v2";
const REMINDERS_STORAGE_KEY = "scholarai_scheduled_reminders_v2";

function normalizeStatus(status: string): ApplicationStatus {
  if (status === "Applied") return "Submitted";
  if (status === "Interviewing") return "Shortlisted / Interview";
  return status as ApplicationStatus;
}

export function ApplicationTrackerProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<
    Record<string, ApplicationRecord>
  >({});
  const [remindersMap, setRemindersMap] = useState<
    Record<string, ScheduledReminderRecord>
  >({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedV2 = localStorage.getItem(STORAGE_KEY);
      const storedV1 = localStorage.getItem("scholarai_application_tracker");
      const raw = storedV2 || storedV1;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          const migrated: Record<string, ApplicationRecord> = {};
          for (const [k, val] of Object.entries(parsed)) {
            const rec = val as ApplicationRecord;
            if (rec && rec.status) {
              const norm = normalizeStatus(rec.status);
              migrated[String(k)] = {
                ...rec,
                scholarshipId: isNaN(Number(k)) ? k : Number(k),
                status: norm,
                verificationState:
                  rec.verificationState ||
                  (rec.submissionConfirmationReceipt
                    ? "Portal Receipt Attached"
                    : "Student Self-Reported"),
                historyLog: rec.historyLog || [
                  {
                    status: norm,
                    timestamp: rec.updatedAt || new Date().toISOString(),
                    note: rec.notes || "Status recorded",
                  },
                ],
              };
            }
          }
          setApplications(migrated);
        }
      }

      const storedRem = localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (storedRem) {
        const parsedRem = JSON.parse(storedRem);
        if (Array.isArray(parsedRem)) {
          const map: Record<string, ScheduledReminderRecord> = {};
          for (const r of parsedRem) {
            if (r && r.scholarshipId !== undefined) {
              map[String(r.scholarshipId)] = r;
            }
          }
          setRemindersMap(map);
        } else if (typeof parsedRem === "object" && parsedRem !== null) {
          setRemindersMap(parsedRem);
        }
      }
    } catch (error) {
      console.error("Failed to load application tracker data:", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(remindersMap));
    } catch (error) {
      console.error("Failed to save application tracker data:", error);
    }

    // Sync with server-side persistent store
    fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "applications",
        data: { applications, reminders: remindersMap },
      }),
    }).catch(() => {
      // Offline fallback remains in localStorage
    });
  }, [applications, remindersMap, isInitialized]);

  const getStatus = useCallback(
    (scholarshipId: number | string): ApplicationStatus | null => {
      return applications[String(scholarshipId)]?.status ?? null;
    },
    [applications]
  );

  const getRecord = useCallback(
    (scholarshipId: number | string): ApplicationRecord | null => {
      return applications[String(scholarshipId)] ?? null;
    },
    [applications]
  );

  const getReminder = useCallback(
    (scholarshipId: number | string): ScheduledReminderRecord | undefined => {
      return remindersMap[String(scholarshipId)];
    },
    [remindersMap]
  );

  const setStatus = useCallback(
    (
      scholarshipId: number | string,
      status: ApplicationStatus | null,
      notes?: string,
      extra?: Partial<ApplicationRecord>
    ) => {
      const key = String(scholarshipId);
      setApplications((prev) => {
        const next = { ...prev };
        if (!status) {
          delete next[key];
        } else {
          const norm = normalizeStatus(status);
          const existing = prev[key];
          const nowIso = new Date().toISOString();
          const newHistory: ApplicationHistoryEntry = {
            status: norm,
            timestamp: nowIso,
            note: notes || `Updated stage to ${norm}`,
          };
          next[key] = {
            ...existing,
            ...extra,
            scholarshipId,
            status: norm,
            updatedAt: nowIso,
            notes: notes ?? existing?.notes,
            verificationState:
              extra?.submissionConfirmationReceipt ||
              existing?.submissionConfirmationReceipt
                ? "Portal Receipt Attached"
                : "Student Self-Reported",
            historyLog: [newHistory, ...(existing?.historyLog || [])].slice(
              0,
              20
            ),
          };
        }
        return next;
      });

      // Automatically pause deadline reminders if application is Submitted, Awarded, Rejected, or Withdrawn
      if (
        status &&
        ["Submitted", "Applied", "Awarded", "Rejected", "Withdrawn"].includes(
          status
        )
      ) {
        setRemindersMap((prev) => {
          if (!prev[key]) return prev;
          return {
            ...prev,
            [key]: {
              ...prev[key],
              active: false,
            },
          };
        });
      }
    },
    []
  );

  const updateApplicationDetails = useCallback(
    (scholarshipId: number | string, updates: Partial<ApplicationRecord>) => {
      const key = String(scholarshipId);
      setApplications((prev) => {
        const existing = prev[key] || {
          scholarshipId,
          status: "Saved" as ApplicationStatus,
          updatedAt: new Date().toISOString(),
          historyLog: [],
        };
        const nowIso = new Date().toISOString();
        const nextStatus = updates.status
          ? normalizeStatus(updates.status)
          : existing.status;

        const historyLog =
          updates.status && updates.status !== existing.status
            ? [
                {
                  status: nextStatus,
                  timestamp: nowIso,
                  note:
                    updates.notes ||
                    (updates.applicationReferenceId
                      ? `Recorded Application ID: ${updates.applicationReferenceId}`
                      : `Stage changed to ${nextStatus}`),
                },
                ...(existing.historyLog || []),
              ]
            : existing.historyLog || [];

        const receipt =
          updates.submissionConfirmationReceipt ??
          existing.submissionConfirmationReceipt;

        return {
          ...prev,
          [key]: {
            ...existing,
            ...updates,
            status: nextStatus,
            updatedAt: nowIso,
            verificationState: receipt
              ? "Portal Receipt Attached"
              : "Student Self-Reported",
            historyLog,
          },
        };
      });
    },
    []
  );

  const toggleApplicationDocument = useCallback(
    (scholarshipId: number | string, docName: string, scholarshipTitle?: string) => {
      const key = String(scholarshipId);
      setApplications((prev) => {
        const existing = prev[key] || {
          scholarshipId,
          scholarshipTitle,
          status: "Preparing Documents" as ApplicationStatus,
          updatedAt: new Date().toISOString(),
          completedDocuments: [],
          historyLog: [
            {
              status: "Preparing Documents" as ApplicationStatus,
              timestamp: new Date().toISOString(),
              note: "Started document checklist preparation",
            },
          ],
        };
        const currentDocs = existing.completedDocuments || [];
        const hasDoc = currentDocs.includes(docName);
        const updatedDocs = hasDoc
          ? currentDocs.filter((d) => d !== docName)
          : [...currentDocs, docName];

        return {
          ...prev,
          [key]: {
            ...existing,
            scholarshipTitle: scholarshipTitle || existing.scholarshipTitle,
            completedDocuments: updatedDocs,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    []
  );

  const scheduleReminder = useCallback(
    (
      record: Omit<ScheduledReminderRecord, "createdAt" | "active" | "channels"> & {
        createdAt?: string;
        active?: boolean;
        channels?: {
          inApp: boolean;
          browserPush: boolean;
          calendarExported: boolean;
        };
      }
    ) => {
      const key = String(record.scholarshipId);
      const fullRecord: ScheduledReminderRecord = {
        ...record,
        channels: record.channels || {
          inApp: record.inAppEnabled ?? true,
          browserPush: record.browserPushEnabled ?? false,
          calendarExported: false,
        },
        createdAt: record.createdAt || new Date().toISOString(),
        active: record.active ?? true,
      };
      setRemindersMap((prev) => ({
        ...prev,
        [key]: fullRecord,
      }));
    },
    []
  );

  const cancelReminder = useCallback((scholarshipId: number | string) => {
    const key = String(scholarshipId);
    setRemindersMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const removeStatus = useCallback((scholarshipId: number | string) => {
    const key = String(scholarshipId);
    setApplications((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setApplications({});
    setRemindersMap({});
  }, []);

  const reminders = Object.values(remindersMap);

  return (
    <ApplicationTrackerContext.Provider
      value={{
        applications,
        reminders,
        remindersMap,
        getStatus,
        getRecord,
        getReminder,
        setStatus,
        updateApplicationDetails,
        toggleApplicationDocument,
        toggleCompletedDocument: toggleApplicationDocument,
        scheduleReminder,
        cancelReminder,
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
    throw new Error(
      "useApplicationTracker must be used within an ApplicationTrackerProvider"
    );
  }
  return context;
}
