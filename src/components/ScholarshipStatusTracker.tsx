"use client";

import React, { useState } from "react";
import {
  ApplicationStatus,
  ALL_APPLICATION_STATUSES,
  useApplicationTracker,
} from "@/contexts/ApplicationTrackerContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bookmark,
  FileText,
  CheckCircle2,
  PlayCircle,
  Send,
  Clock,
  CalendarCheck,
  Trophy,
  XCircle,
  MinusCircle,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_STEPS: ApplicationStatus[] = ALL_APPLICATION_STATUSES;

export const STATUS_METADATA: Record<
  ApplicationStatus,
  {
    label: ApplicationStatus;
    stepIndex: number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeStyle: string;
    activeButtonStyle: string;
    lightBg: string;
  }
> = {
  Saved: {
    label: "Saved",
    stepIndex: 1,
    description: "Bookmarked for review and preparation",
    icon: Bookmark,
    accentColor: "text-slate-600 dark:text-slate-400",
    badgeStyle: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700",
    activeButtonStyle: "bg-slate-700 text-white hover:bg-slate-800 border-slate-700 shadow-sm",
    lightBg: "bg-slate-50/70 dark:bg-slate-950/20",
  },
  "Preparing Documents": {
    label: "Preparing Documents",
    stepIndex: 2,
    description: "Gathering income, caste, and mark sheet certificates",
    icon: FileText,
    accentColor: "text-indigo-600 dark:text-indigo-400",
    badgeStyle: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    activeButtonStyle: "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-sm",
    lightBg: "bg-indigo-50/70 dark:bg-indigo-950/20",
  },
  "Ready to Apply": {
    label: "Ready to Apply",
    stepIndex: 3,
    description: "All required documents and essays are verified and ready",
    icon: CheckCircle2,
    accentColor: "text-cyan-600 dark:text-cyan-400",
    badgeStyle: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
    activeButtonStyle: "bg-cyan-600 text-white hover:bg-cyan-700 border-cyan-600 shadow-sm",
    lightBg: "bg-cyan-50/70 dark:bg-cyan-950/20",
  },
  "Application Started": {
    label: "Application Started",
    stepIndex: 4,
    description: "Opened official scholarship portal and started registration",
    icon: PlayCircle,
    accentColor: "text-blue-600 dark:text-blue-400",
    badgeStyle: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    activeButtonStyle: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-sm",
    lightBg: "bg-blue-50/70 dark:bg-blue-950/20",
  },
  Submitted: {
    label: "Submitted",
    stepIndex: 5,
    description: "Confirmed application submission on official portal",
    icon: Send,
    accentColor: "text-violet-600 dark:text-violet-400",
    badgeStyle: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
    activeButtonStyle: "bg-violet-600 text-white hover:bg-violet-700 border-violet-600 shadow-sm",
    lightBg: "bg-violet-50/70 dark:bg-violet-950/20",
  },
  "Under Review": {
    label: "Under Review",
    stepIndex: 6,
    description: "Institute / State / Nodal officer verification in progress",
    icon: Clock,
    accentColor: "text-amber-600 dark:text-amber-400",
    badgeStyle: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    activeButtonStyle: "bg-amber-600 text-white hover:bg-amber-700 border-amber-600 shadow-sm",
    lightBg: "bg-amber-50/70 dark:bg-amber-950/20",
  },
  "Shortlisted / Interview": {
    label: "Shortlisted / Interview",
    stepIndex: 7,
    description: "Shortlisted for telephonic/panel interview or merit list",
    icon: CalendarCheck,
    accentColor: "text-orange-600 dark:text-orange-400",
    badgeStyle: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
    activeButtonStyle: "bg-orange-600 text-white hover:bg-orange-700 border-orange-600 shadow-sm",
    lightBg: "bg-orange-50/70 dark:bg-orange-950/20",
  },
  Awarded: {
    label: "Awarded",
    stepIndex: 8,
    description: "Scholarship sanctioned / disbursed via DBT!",
    icon: Trophy,
    accentColor: "text-emerald-600 dark:text-emerald-400",
    badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    activeButtonStyle: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-sm",
    lightBg: "bg-emerald-50/70 dark:bg-emerald-950/20",
  },
  Rejected: {
    label: "Rejected",
    stepIndex: 9,
    description: "Application was not selected in this cycle",
    icon: XCircle,
    accentColor: "text-rose-600 dark:text-rose-400",
    badgeStyle: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    activeButtonStyle: "bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-sm",
    lightBg: "bg-rose-50/70 dark:bg-rose-950/20",
  },
  Withdrawn: {
    label: "Withdrawn",
    stepIndex: 10,
    description: "Application withdrawn by student",
    icon: MinusCircle,
    accentColor: "text-zinc-600 dark:text-zinc-400",
    badgeStyle: "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700",
    activeButtonStyle: "bg-zinc-600 text-white hover:bg-zinc-700 border-zinc-600 shadow-sm",
    lightBg: "bg-zinc-50/70 dark:bg-zinc-950/20",
  },
  Applied: {
    label: "Submitted",
    stepIndex: 5,
    description: "Confirmed application submission on official portal",
    icon: Send,
    accentColor: "text-violet-600 dark:text-violet-400",
    badgeStyle: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
    activeButtonStyle: "bg-violet-600 text-white hover:bg-violet-700 border-violet-600 shadow-sm",
    lightBg: "bg-violet-50/70 dark:bg-violet-950/20",
  },
  Interviewing: {
    label: "Shortlisted / Interview",
    stepIndex: 7,
    description: "Shortlisted for telephonic/panel interview or merit list",
    icon: CalendarCheck,
    accentColor: "text-orange-600 dark:text-orange-400",
    badgeStyle: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
    activeButtonStyle: "bg-orange-600 text-white hover:bg-orange-700 border-orange-600 shadow-sm",
    lightBg: "bg-orange-50/70 dark:bg-orange-950/20",
  },
};

export interface ScholarshipStatusTrackerProps {
  scholarshipId?: string | number;
  scholarshipTitle?: string;
  status?: ApplicationStatus | null;
  onStatusChange?: (status: ApplicationStatus | null) => void;
  variant?: "full" | "stepper" | "buttons" | "badge-selector";
  size?: "sm" | "default";
  showUpdatedDate?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus | null | undefined;
  className?: string;
}) {
  if (!status || !STATUS_METADATA[status]) return null;
  const meta = STATUS_METADATA[status];
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium px-2.5 py-0.5 border shadow-none",
        meta.badgeStyle,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{meta.label}</span>
    </Badge>
  );
}

export function ScholarshipStatusTracker({
  scholarshipId,
  scholarshipTitle,
  status: controlledStatus,
  onStatusChange,
  variant = "full",
  size = "default",
  showUpdatedDate = true,
  className,
}: ScholarshipStatusTrackerProps) {
  const { toast } = useToast();

  let context: ReturnType<typeof useApplicationTracker> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    context = useApplicationTracker();
  } catch {
    context = null;
  }

  const currentStatus: ApplicationStatus | null =
    controlledStatus !== undefined
      ? controlledStatus
      : scholarshipId !== undefined && context
      ? context.getStatus(scholarshipId)
      : null;

  const currentRecord =
    scholarshipId !== undefined && context ? context.getRecord(scholarshipId) : null;

  const [refIdInput, setRefIdInput] = useState(currentRecord?.applicationReferenceId || "");
  const [subDateInput, setSubDateInput] = useState(
    currentRecord?.submissionDate ? currentRecord.submissionDate.slice(0, 10) : ""
  );
  const [notesInput, setNotesInput] = useState(currentRecord?.notes || "");
  const [receiptName, setReceiptName] = useState(currentRecord?.submissionConfirmationReceipt || "");

  const handleSelectStatus = (selectedStatus: ApplicationStatus) => {
    const newStatus: ApplicationStatus | null =
      currentStatus === selectedStatus ? null : selectedStatus;

    if (onStatusChange) {
      onStatusChange(newStatus);
    }

    if (scholarshipId !== undefined && context) {
      context.setStatus(scholarshipId, newStatus, scholarshipTitle, {
        applicationReferenceId: refIdInput || currentRecord?.applicationReferenceId,
        submissionDate: subDateInput || currentRecord?.submissionDate,
        notes: notesInput || currentRecord?.notes,
        submissionConfirmationReceipt: receiptName || currentRecord?.submissionConfirmationReceipt,
      });
    }

    if (newStatus) {
      toast({
        title: `Stage Updated: ${newStatus}`,
        description: scholarshipTitle
          ? `"${scholarshipTitle}" is now marked as ${newStatus} (Student Self-Reported).`
          : `Application stage set to ${newStatus}.`,
      });
    } else {
      toast({
        title: "Tracking Cleared",
        description: "Removed application stage tracking for this scholarship.",
      });
    }
  };

  const handleSaveDetails = () => {
    if (scholarshipId === undefined || !context) return;
    context.updateApplicationDetails(scholarshipId, {
      applicationReferenceId: refIdInput.trim() || undefined,
      submissionDate: subDateInput || undefined,
      notes: notesInput.trim() || undefined,
      submissionConfirmationReceipt: receiptName.trim() || undefined,
    });
    toast({
      title: "Application Details Saved",
      description: receiptName.trim()
        ? "Portal confirmation receipt recorded."
        : "Reference ID, date, and notes saved to your tracker.",
    });
  };

  const updatedDateStr = currentRecord?.updatedAt
    ? new Date(currentRecord.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const compactSteps: ApplicationStatus[] = [
    "Saved",
    "Preparing Documents",
    "Application Started",
    "Submitted",
    "Awarded",
  ];

  if (variant === "badge-selector") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 flex-wrap", className)}>
        {compactSteps.map((step) => {
          const meta = STATUS_METADATA[step];
          const Icon = meta.icon;
          const isActive = currentStatus === step;

          return (
            <button
              key={step}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectStatus(step);
              }}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer",
                isActive
                  ? meta.activeButtonStyle
                  : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border"
              )}
            >
              <Icon className="h-3 w-3" />
              <span>{step}</span>
              {isActive && <Check className="h-3 w-3 ml-0.5" />}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "buttons") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {compactSteps.map((step) => {
            const meta = STATUS_METADATA[step];
            const Icon = meta.icon;
            const isActive = currentStatus === step;

            return (
              <Button
                key={step}
                type="button"
                variant={isActive ? "default" : "outline"}
                size={size === "sm" ? "sm" : "default"}
                onClick={() => handleSelectStatus(step)}
                className={cn(
                  "flex items-center justify-center gap-1.5 transition-all text-xs font-medium",
                  isActive && meta.activeButtonStyle
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{step}</span>
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm transition-all",
        currentStatus && STATUS_METADATA[currentStatus]?.lightBg,
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold tracking-tight">10-Stage Smart Application Tracker</h4>
              {currentRecord && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] py-0 px-1.5",
                    currentRecord.verificationState === "Portal Receipt Attached"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  )}
                >
                  {currentRecord.verificationState === "Portal Receipt Attached" ? (
                    <FileCheck2 className="h-3 w-3 mr-1 inline" />
                  ) : (
                    <ShieldCheck className="h-3 w-3 mr-1 inline" />
                  )}
                  {currentRecord.verificationState}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStatus && STATUS_METADATA[currentStatus]
                ? STATUS_METADATA[currentStatus].description
                : "Select your current stage. Clicking external portal links never auto-submits without your confirmation."}
            </p>
          </div>
        </div>

        {currentStatus ? (
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={currentStatus} />
            <button
              type="button"
              onClick={() => handleSelectStatus(currentStatus)}
              title="Reset status"
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors text-xs flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
            Not tracked yet
          </Badge>
        )}
      </div>

      {/* All 10 Required Application Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
        {STATUS_STEPS.map((step) => {
          const meta = STATUS_METADATA[step];
          const Icon = meta.icon;
          const isActive = currentStatus === step;

          return (
            <Button
              key={step}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelectStatus(step)}
              className={cn(
                "w-full h-8 px-2 text-[11px] font-medium flex items-center justify-start gap-1.5 transition-all",
                isActive
                  ? meta.activeButtonStyle
                  : "hover:bg-muted/70 text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{step}</span>
            </Button>
          );
        })}
      </div>

      {/* Official Application Reference & Submission Metadata */}
      {scholarshipId !== undefined && (
        <div className="pt-3 border-t border-border/60 space-y-3">
          <p className="text-xs font-semibold text-foreground">
            Official Portal Submission & Reference Record
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">
                Portal Application / NSP ID
              </label>
              <Input
                value={refIdInput}
                onChange={(e) => setRefIdInput(e.target.value)}
                placeholder="e.g. TS2026109482 / NSP-8821"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">
                Submission Date
              </label>
              <Input
                type="date"
                value={subDateInput}
                onChange={(e) => setSubDateInput(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">
                Acknowledgement Receipt Ref
              </label>
              <Input
                value={receiptName}
                onChange={(e) => setReceiptName(e.target.value)}
                placeholder="e.g. ePASS_Receipt_2026.pdf"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Personal notes (e.g. Bonafide submitted to college nodal officer on Monday)..."
              className="h-8 text-xs flex-grow"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleSaveDetails}
              className="h-8 text-xs shrink-0"
            >
              Save Record
            </Button>
          </div>
        </div>
      )}

      {showUpdatedDate && updatedDateStr && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <span>
            Last updated: {updatedDateStr}
            {currentRecord?.applicationReferenceId
              ? ` • Ref ID: ${currentRecord.applicationReferenceId}`
              : ""}
          </span>
          <button
            type="button"
            onClick={() => handleSelectStatus(currentStatus!)}
            className="text-xs hover:underline hover:text-destructive"
          >
            Clear tracking
          </button>
        </div>
      )}
    </div>
  );
}
