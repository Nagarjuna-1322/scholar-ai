"use client";

import React from "react";
import {
  ApplicationStatus,
  useApplicationTracker,
} from "@/contexts/ApplicationTrackerContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Send,
  CalendarCheck,
  Trophy,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_STEPS: ApplicationStatus[] = ["Applied", "Interviewing", "Awarded"];

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
  Applied: {
    label: "Applied",
    stepIndex: 1,
    description: "Application submitted and under review",
    icon: Send,
    accentColor: "text-blue-600 dark:text-blue-400",
    badgeStyle:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    activeButtonStyle:
      "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-sm",
    lightBg: "bg-blue-50/70 dark:bg-blue-950/20",
  },
  Interviewing: {
    label: "Interviewing",
    stepIndex: 2,
    description: "Invited to interview or review round",
    icon: CalendarCheck,
    accentColor: "text-amber-600 dark:text-amber-400",
    badgeStyle:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    activeButtonStyle:
      "bg-amber-600 text-white hover:bg-amber-700 border-amber-600 shadow-sm",
    lightBg: "bg-amber-50/70 dark:bg-amber-950/20",
  },
  Awarded: {
    label: "Awarded",
    stepIndex: 3,
    description: "Scholarship awarded! Congratulations!",
    icon: Trophy,
    accentColor: "text-emerald-600 dark:text-emerald-400",
    badgeStyle:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    activeButtonStyle:
      "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 shadow-sm",
    lightBg: "bg-emerald-50/70 dark:bg-emerald-950/20",
  },
};

export interface ScholarshipStatusTrackerProps {
  scholarshipId?: number;
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

  // Try to use context if scholarshipId is provided
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
      : scholarshipId && context
      ? context.getStatus(scholarshipId)
      : null;

  const currentRecord = scholarshipId && context ? context.getRecord(scholarshipId) : null;

  const handleSelectStatus = (selectedStatus: ApplicationStatus) => {
    // If clicking the current status, toggle it off/clear it
    const newStatus: ApplicationStatus | null =
      currentStatus === selectedStatus ? null : selectedStatus;

    if (onStatusChange) {
      onStatusChange(newStatus);
    }

    if (scholarshipId && context) {
      context.setStatus(scholarshipId, newStatus);
    }

    if (newStatus) {
      toast({
        title: `Status Updated: ${newStatus}`,
        description: scholarshipTitle
          ? `Marked "${scholarshipTitle}" as ${newStatus}.`
          : `Marked scholarship as ${newStatus}.`,
      });
    } else {
      toast({
        title: "Status Cleared",
        description: "Application tracking removed for this scholarship.",
      });
    }
  };

  const currentStepNumber = currentStatus
    ? STATUS_METADATA[currentStatus].stepIndex
    : 0;

  // Format updated timestamp
  const updatedDateStr = currentRecord?.updatedAt
    ? new Date(currentRecord.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // 1. BADGE SELECTOR VARIANT (Super compact for small card headers or tables)
  if (variant === "badge-selector") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 flex-wrap", className)}>
        {STATUS_STEPS.map((step) => {
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
              title={
                isActive
                  ? `Currently marked as ${step}. Click to unmark.`
                  : `Mark as ${step}`
              }
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer",
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

  // 2. BUTTONS VARIANT (Segmented buttons)
  if (variant === "buttons") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="grid grid-cols-3 gap-2">
          {STATUS_STEPS.map((step) => {
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
                  "flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm font-medium",
                  isActive && meta.activeButtonStyle
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{step}</span>
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. FULL / STEPPER VARIANT (Rich interactive tracker with step pipeline & action pills)
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm transition-all",
        currentStatus && STATUS_METADATA[currentStatus].lightBg,
        className
      )}
    >
      {/* Header with Title and Current Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight">Application Tracker</h4>
            <p className="text-xs text-muted-foreground">
              {currentStatus
                ? STATUS_METADATA[currentStatus].description
                : "Track your progress: select where you are in the application process."}
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
            Not applied yet
          </Badge>
        )}
      </div>

      {/* Visual Stepper Pipeline */}
      <div className="relative pt-2 pb-1">
        {/* Background connector bar */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-muted rounded-full" />
        
        {/* Active colored progress fill */}
        <div
          className="absolute top-5 left-8 h-1 bg-primary rounded-full transition-all duration-300"
          style={{
            width:
              currentStepNumber === 0
                ? "0%"
                : currentStepNumber === 1
                ? "0%"
                : currentStepNumber === 2
                ? "50%"
                : "calc(100% - 4rem)",
          }}
        />

        <div className="relative flex justify-between items-start">
          {STATUS_STEPS.map((step, idx) => {
            const meta = STATUS_METADATA[step];
            const Icon = meta.icon;
            const isSelected = currentStatus === step;
            const isCompleted = currentStepNumber >= meta.stepIndex;

            return (
              <button
                key={step}
                type="button"
                onClick={() => handleSelectStatus(step)}
                className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
              >
                {/* Node Circle */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 z-10",
                    isSelected
                      ? cn("border-primary text-primary-foreground bg-primary ring-4 ring-primary/20 scale-105")
                      : isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground group-hover:border-primary/60 group-hover:text-foreground"
                  )}
                >
                  {isCompleted && !isSelected ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                {/* Node Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium transition-colors",
                    isSelected
                      ? "text-primary font-semibold"
                      : isCompleted
                      ? "text-foreground font-medium"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {step}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  Step {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Action Toggle Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-1">
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
                "w-full h-9 text-xs font-medium flex items-center justify-center gap-1.5 transition-all",
                isActive
                  ? meta.activeButtonStyle
                  : "hover:bg-muted/70 text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{step}</span>
              {isActive && <Check className="h-3 w-3 ml-0.5" />}
            </Button>
          );
        })}
      </div>

      {/* Footer Info: Last updated timestamp */}
      {showUpdatedDate && updatedDateStr && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
          <span>Last status update: {updatedDateStr}</span>
          <button
            type="button"
            onClick={() => handleSelectStatus(currentStatus!)}
            className="text-xs hover:underline hover:text-destructive"
          >
            Clear status
          </button>
        </div>
      )}
    </div>
  );
}
