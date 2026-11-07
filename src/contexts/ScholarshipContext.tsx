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
import {
  Scholarship,
  ExpiredScholarshipRecord,
  SuspiciousReportRecord,
  AdminAuditLogEntry,
  sampleScholarships,
  initialExpiredScholarships,
  rawInitialScholarships,
  updateScholarshipCatalog,
  detectDuplicateScholarship,
} from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

interface ScholarshipContextType {
  scholarships: Scholarship[];
  allCatalogScholarships: Scholarship[];
  expiredArchive: ExpiredScholarshipRecord[];
  newlyPublished: Scholarship[];
  lastCheckedTime: string | null;
  hasNewAlert: boolean;
  isUpdateModalOpen: boolean;
  setUpdateModalOpen: (open: boolean) => void;
  checkForUpdates: (manual?: boolean) => { expiredRemoved: number; newAdded: number };
  publishScholarship: (
    newScheme: Omit<Scholarship, "id" | "isNew" | "publishedAt">,
    actorEmail?: string
  ) => Scholarship | null;
  updateScholarshipRecord: (
    idOrUpdated: number | string | Scholarship,
    patchOrActorEmail?: Partial<Scholarship> | string,
    actorEmail?: string
  ) => void;
  markScholarshipExpired: (
    id: number | string,
    reason?: string,
    actorEmail?: string
  ) => void;
  dismissNewAlert: () => void;
  getScholarshipById: (id: number | string) => Scholarship | undefined;
  // Saved / Bookmarked scholarships
  savedIds: (number | string)[];
  toggleSavedScholarship: (id: number | string) => void;
  isScholarshipSaved: (id: number | string) => boolean;
  // Side-by-side comparison list (max 4)
  comparisonIds: (number | string)[];
  toggleCompareScholarship: (id: number | string) => void;
  clearComparison: () => void;
  // Fraud / Inaccuracy Reporting & Admin Audit Log
  reports: SuspiciousReportRecord[];
  submitListingReport: (
    report: Omit<SuspiciousReportRecord, "id" | "createdAt" | "status">
  ) => void;
  resolveListingReport: (
    reportId: string,
    status: "Resolved" | "Dismissed",
    adminNotes?: string,
    actorEmail?: string
  ) => void;
  auditLogs: AdminAuditLogEntry[];
  stats: {
    totalActive: number;
    newlyPublishedCount: number;
    expiredReplacedCount: number;
    govtCount: number;
    privateCount: number;
    verifiedCount: number;
    pendingReportsCount: number;
    openReportsCount: number;
  };
}

const ScholarshipContext = createContext<ScholarshipContextType | undefined>(undefined);

const STORAGE_SCHOLARSHIPS_KEY = "scholarai_active_scholarships_v5";
const STORAGE_EXPIRED_KEY = "scholarai_expired_archive_v5";
const STORAGE_SAVED_KEY = "scholarai_saved_scholarships_v5";
const STORAGE_COMPARE_KEY = "scholarai_compare_scholarships_v5";
const STORAGE_REPORTS_KEY = "scholarai_reports_v5";
const STORAGE_AUDIT_KEY = "scholarai_admin_audit_v5";

function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialAuditLogs: AdminAuditLogEntry[] = [
  {
    id: "audit-1",
    timestamp: "2026-11-05T10:30:00.000Z",
    actorEmail: "mmnagarjunareddy@gmail.com",
    action: "Verified Official Source",
    targetTitle: "Telangana ePASS Post-Matric Scholarship (RTF & MTF)",
    details: "Verified official domain telanganaepass.cgg.gov.in and 2026-27 RTF/MTF guidelines.",
  },
  {
    id: "audit-2",
    timestamp: "2026-11-04T14:15:00.000Z",
    actorEmail: "mmnagarjunareddy@gmail.com",
    action: "Archived Past Deadline",
    targetTitle: "Infosys Foundation STEM Stars Scholarship",
    details: "Deadline 2026-10-25 passed. Moved to historical archive without fabricating unconfirmed renewal dates.",
  },
];

export function ScholarshipProvider({ children }: { children: ReactNode }) {
  const [scholarships, setScholarships] = useState<Scholarship[]>(sampleScholarships);
  const [expiredArchive, setExpiredArchive] = useState<ExpiredScholarshipRecord[]>(
    initialExpiredScholarships
  );
  const [savedIds, setSavedIds] = useState<(number | string)[]>([1, 4, 15, "1", "4", "15"]);
  const [comparisonIds, setComparisonIds] = useState<(number | string)[]>([1, 4, 15]);
  const [reports, setReports] = useState<SuspiciousReportRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>(initialAuditLogs);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [hasNewAlert, setHasNewAlert] = useState<boolean>(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { toast } = useToast();

  // Strictly archives expired scholarships WITHOUT fabricating new deadlines
  const runVerificationPass = useCallback(
    (
      currentList: Scholarship[],
      currentExpired: ExpiredScholarshipRecord[],
      manual: boolean = false
    ) => {
      const todayStr = getCurrentDateString();
      const updatedExpired = [...currentExpired];
      const activeList: Scholarship[] = [];
      let expiredCount = 0;

      for (const item of currentList) {
        if (item.deadline < todayStr || item.application_status === "Closed") {
          const alreadyArchived = updatedExpired.some((e) => e.expiredId === item.id);
          if (!alreadyArchived) {
            expiredCount++;
            updatedExpired.unshift({
              expiredId: item.id,
              expiredTitle: item.title,
              provider: item.provider,
              originalDeadline: item.deadline,
              category: item.category,
              retiredOn: todayStr,
              reason: `Verified deadline (${item.deadline}) has passed. Preserved in historical archive pending official provider announcement.`,
            });
          }
        } else {
          activeList.push(item);
        }
      }

      activeList.sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );

      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setScholarships(activeList);
      setExpiredArchive(updatedExpired);
      setLastCheckedTime(timestamp);

      try {
        localStorage.setItem(STORAGE_SCHOLARSHIPS_KEY, JSON.stringify(activeList));
        localStorage.setItem(STORAGE_EXPIRED_KEY, JSON.stringify(updatedExpired));
      } catch {
        // Ignore storage error
      }

      if (manual) {
        toast({
          title: "Catalog Verification Complete",
          description:
            expiredCount > 0
              ? `${expiredCount} scholarship(s) past their verified deadline were moved to the Historical Archive. ${activeList.length} verified active schemes available.`
              : `All ${activeList.length} active scholarships have verified open/upcoming deadlines.`,
        });
      }

      return { expiredRemoved: expiredCount, newAdded: 0 };
    },
    [toast]
  );

  useEffect(() => {
    let initialList = rawInitialScholarships;
    let initialExp = initialExpiredScholarships;

    try {
      const storedList = localStorage.getItem(STORAGE_SCHOLARSHIPS_KEY);
      const storedExp = localStorage.getItem(STORAGE_EXPIRED_KEY);
      const storedSaved = localStorage.getItem(STORAGE_SAVED_KEY);
      const storedCompare = localStorage.getItem(STORAGE_COMPARE_KEY);
      const storedReports = localStorage.getItem(STORAGE_REPORTS_KEY);
      const storedAudit = localStorage.getItem(STORAGE_AUDIT_KEY);

      if (storedList) {
        const parsed = JSON.parse(storedList);
        if (Array.isArray(parsed) && parsed.length > 0) initialList = parsed;
      }
      if (storedExp) {
        const parsedExp = JSON.parse(storedExp);
        if (Array.isArray(parsedExp)) initialExp = parsedExp;
      }
      if (storedSaved) setSavedIds(JSON.parse(storedSaved));
      if (storedCompare) setComparisonIds(JSON.parse(storedCompare));
      if (storedReports) setReports(JSON.parse(storedReports));
      if (storedAudit) setAuditLogs(JSON.parse(storedAudit));
    } catch {
      // Fallback to defaults
    }

    const result = updateScholarshipCatalog(initialList, getCurrentDateString());
    setScholarships(result.activeScholarships);
    setExpiredArchive(
      result.expiredScholarships.length > 0 ? result.expiredScholarships : initialExp
    );
    setLastCheckedTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_SAVED_KEY, JSON.stringify(savedIds));
      localStorage.setItem(STORAGE_COMPARE_KEY, JSON.stringify(comparisonIds));
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
      localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(auditLogs));
    } catch {
      // Ignore
    }
  }, [savedIds, comparisonIds, reports, auditLogs, isInitialized]);

  const checkForUpdates = useCallback(
    (manual: boolean = true) => {
      return runVerificationPass(scholarships, expiredArchive, manual);
    },
    [scholarships, expiredArchive, runVerificationPass]
  );

  const publishScholarship = useCallback(
    (
      newScheme: Omit<Scholarship, "id" | "isNew" | "publishedAt">,
      actorEmail: string = "mmnagarjunareddy@gmail.com"
    ): Scholarship | null => {
      const duplicate = detectDuplicateScholarship(newScheme, scholarships);
      if (duplicate) {
        toast({
          variant: "destructive",
          title: "Duplicate Scholarship Detected",
          description: `"${duplicate.title}" by ${duplicate.provider} already exists in the active catalog.`,
        });
        return null;
      }

      const todayStr = getCurrentDateString();
      const created: Scholarship = {
        ...newScheme,
        id: Date.now(),
        isNew: true,
        publishedAt: todayStr,
        last_verified_at: todayStr,
        verification_status: newScheme.verification_status || "Verified Source",
        application_status: newScheme.application_status || "Open",
      };

      setScholarships((prev) => {
        const updated = [created, ...prev];
        try {
          localStorage.setItem(STORAGE_SCHOLARSHIPS_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorEmail,
          action: "Published Verified Scholarship",
          targetTitle: created.title,
          details: `Added ${created.category} scheme (${created.amount}) with deadline ${created.deadline}.`,
        },
        ...prev,
      ]);

      setHasNewAlert(true);
      toast({
        title: "Scholarship Verified & Published",
        description: `"${created.title}" is now live in the verified catalog.`,
      });

      return created;
    },
    [scholarships, toast]
  );

  const updateScholarshipRecord = useCallback(
    (
      idOrUpdated: number | string | Scholarship,
      patchOrActorEmail?: Partial<Scholarship> | string,
      actorEmailArg: string = "mmnagarjunareddy@gmail.com"
    ) => {
      const todayStr = getCurrentDateString();
      let targetTitle = "Scholarship";
      let targetDeadline = "";
      let targetVerification = "";
      const actorEmail =
        typeof patchOrActorEmail === "string"
          ? patchOrActorEmail
          : actorEmailArg;

      setScholarships((prev) => {
        const next = prev.map((s) => {
          if (typeof idOrUpdated === "object" && idOrUpdated !== null) {
            if (String(s.id) === String(idOrUpdated.id)) {
              targetTitle = idOrUpdated.title;
              targetDeadline = idOrUpdated.deadline;
              targetVerification = idOrUpdated.verification_status || "Verified Source";
              return { ...idOrUpdated, last_verified_at: todayStr };
            }
            return s;
          } else {
            if (String(s.id) === String(idOrUpdated)) {
              const patch =
                typeof patchOrActorEmail === "object" && patchOrActorEmail !== null
                  ? patchOrActorEmail
                  : {};
              const merged: Scholarship = {
                ...s,
                ...patch,
                last_verified_at: todayStr,
              };
              targetTitle = merged.title;
              targetDeadline = merged.deadline;
              targetVerification = merged.verification_status || "Verified Source";
              return merged;
            }
            return s;
          }
        });
        try {
          localStorage.setItem(STORAGE_SCHOLARSHIPS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorEmail,
          action: "Updated Scholarship Record",
          targetTitle,
          details: `Updated deadline (${targetDeadline}) / verification status (${targetVerification}).`,
        },
        ...prev,
      ]);

      toast({
        title: "Scholarship Updated",
        description: `Changes to "${targetTitle}" have been saved.`,
      });
    },
    [toast]
  );

  const markScholarshipExpired = useCallback(
    (
      id: number | string,
      reason: string = "Marked closed by administrator after official portal check.",
      actorEmail: string = "mmnagarjunareddy@gmail.com"
    ) => {
      const target = scholarships.find((s) => String(s.id) === String(id));
      if (!target) return;
      const todayStr = getCurrentDateString();

      setScholarships((prev) => {
        const next = prev.filter((s) => String(s.id) !== String(id));
        try {
          localStorage.setItem(STORAGE_SCHOLARSHIPS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });

      setExpiredArchive((prev) => {
        const next: ExpiredScholarshipRecord[] = [
          {
            expiredId: target.id,
            expiredTitle: target.title,
            provider: target.provider,
            originalDeadline: target.deadline,
            category: target.category,
            retiredOn: todayStr,
            reason,
          },
          ...prev,
        ];
        try {
          localStorage.setItem(STORAGE_EXPIRED_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorEmail,
          action: "Archived Expired Scholarship",
          targetTitle: target.title,
          details: reason,
        },
        ...prev,
      ]);

      toast({
        title: "Moved to Historical Archive",
        description: `"${target.title}" has been marked Closed and archived.`,
      });
    },
    [scholarships, toast]
  );

  const toggleSavedScholarship = useCallback((id: number | string) => {
    const numId = isNaN(Number(id)) ? Number(String(id).replace(/\D/g, "")) || 1 : Number(id);
    setSavedIds((prev) =>
      prev.some((item) => String(item) === String(id) || item === numId)
        ? prev.filter((item) => String(item) !== String(id) && item !== numId)
        : [...prev, numId]
    );
  }, []);

  const isScholarshipSaved = useCallback(
    (id: number | string) =>
      savedIds.some((item) => String(item) === String(id)),
    [savedIds]
  );

  const toggleCompareScholarship = useCallback(
    (id: number | string) => {
      const numId = isNaN(Number(id)) ? Number(String(id).replace(/\D/g, "")) || 1 : Number(id);
      setComparisonIds((prev) => {
        if (prev.some((item) => String(item) === String(id) || item === numId)) {
          return prev.filter((item) => String(item) !== String(id) && item !== numId);
        }
        if (prev.length >= 4) {
          toast({
            title: "Comparison Limit Reached (Max 4)",
            description: "Remove a scholarship from the comparison tray to add another.",
          });
          return prev;
        }
        return [...prev, numId];
      });
    },
    [toast]
  );

  const clearComparison = useCallback(() => {
    setComparisonIds([]);
  }, []);

  const submitListingReport = useCallback(
    (report: Omit<SuspiciousReportRecord, "id" | "createdAt" | "status">) => {
      const created: SuspiciousReportRecord = {
        ...report,
        id: `rep-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "Open",
      };
      setReports((prev) => [created, ...prev]);
      toast({
        title: "Report Sent to Verification Queue",
        description:
          "Thank you. Our verification team will review this listing and official source link.",
      });
    },
    [toast]
  );

  const resolveListingReport = useCallback(
    (
      reportId: string,
      status: "Resolved" | "Dismissed",
      adminNotes: string = "Reviewed by administrator",
      actorEmail: string = "mmnagarjunareddy@gmail.com"
    ) => {
      const target = reports.find((r) => r.id === reportId);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status, adminNotes } : r
        )
      );
      if (target) {
        setAuditLogs((prev) => [
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorEmail,
            action: `Report ${status}`,
            targetTitle: target.scholarshipTitle,
            details: `${target.reason}: ${adminNotes}`,
          },
          ...prev,
        ]);
      }
      toast({
        title: `Report Marked as ${status}`,
        description: "The verification audit log has been updated.",
      });
    },
    [reports, toast]
  );

  const dismissNewAlert = useCallback(() => {
    setHasNewAlert(false);
  }, []);

  const getScholarshipById = useCallback(
    (id: number | string) =>
      scholarships.find((s) => String(s.id) === String(id)) ||
      rawInitialScholarships.find((s) => String(s.id) === String(id)),
    [scholarships]
  );

  const newlyPublished = useMemo(
    () => scholarships.filter((s) => s.isNew),
    [scholarships]
  );

  const allCatalogScholarships = useMemo(() => {
    const map = new Map<number, Scholarship>();
    rawInitialScholarships.forEach((s) => map.set(s.id, s));
    scholarships.forEach((s) => map.set(s.id, s));
    return Array.from(map.values());
  }, [scholarships]);

  const stats = useMemo(() => {
    const openOrPending = reports.filter(
      (r) => r.status === "Pending Review" || r.status === "Open"
    ).length;
    return {
      totalActive: scholarships.length,
      newlyPublishedCount: newlyPublished.length,
      expiredReplacedCount: expiredArchive.length,
      govtCount: scholarships.filter((s) => s.category === "Government").length,
      privateCount: scholarships.filter((s) => s.category === "Private").length,
      verifiedCount: scholarships.filter(
        (s) => s.verification_status === "Verified Source"
      ).length,
      pendingReportsCount: openOrPending,
      openReportsCount: openOrPending,
    };
  }, [scholarships, newlyPublished, expiredArchive, reports]);

  return (
    <ScholarshipContext.Provider
      value={{
        scholarships,
        allCatalogScholarships,
        expiredArchive,
        newlyPublished,
        lastCheckedTime,
        hasNewAlert,
        isUpdateModalOpen,
        setUpdateModalOpen,
        checkForUpdates,
        publishScholarship,
        updateScholarshipRecord,
        markScholarshipExpired,
        dismissNewAlert,
        getScholarshipById,
        savedIds,
        toggleSavedScholarship,
        isScholarshipSaved,
        comparisonIds,
        toggleCompareScholarship,
        clearComparison,
        reports,
        submitListingReport,
        resolveListingReport,
        auditLogs,
        stats,
      }}
    >
      {children}
    </ScholarshipContext.Provider>
  );
}

export function useScholarships() {
  const context = useContext(ScholarshipContext);
  if (!context) {
    throw new Error("useScholarships must be used within a ScholarshipProvider");
  }
  return context;
}
