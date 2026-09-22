"use client";

import React from "react";
import { Clock, Flame, Timer, AlertTriangle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { daysUntil, cn } from "@/lib/utils";

interface DeadlineIndicatorProps {
  deadline: string;
  variant?: "compact" | "detailed" | "badge";
  className?: string;
  showDate?: boolean;
}

export function DeadlineIndicator({
  deadline,
  variant = "detailed",
  className,
  showDate = true,
}: DeadlineIndicatorProps) {
  const daysLeft = daysUntil(deadline);

  // Compute urgency level and colors
  // <= 3 days: Critical (Red)
  // 4 to 7 days: Urgent (Amber / Orange)
  // 8 to 30 days: Approaching (Blue / Indigo)
  // > 30 days: Open / Normal (Emerald / Slate)
  const isCritical = daysLeft <= 3 && daysLeft >= 0;
  const isUrgent = daysLeft > 3 && daysLeft <= 7;
  const isApproaching = daysLeft > 7 && daysLeft <= 30;
  const isExpired = daysLeft < 0;
  const isWithin7Days = daysLeft <= 7 && daysLeft >= 0;

  // Format date display (e.g. "15 Sep 2026")
  const formattedDate = React.useMemo(() => {
    try {
      const parts = deadline.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return deadline;
    } catch {
      return deadline;
    }
  }, [deadline]);

  // Visual progress calculation (based on a 30-day countdown cycle)
  // When 30+ days: 10% filled
  // When 7 days: 77% filled
  // When 3 days: 90% filled
  // When 0 days: 100% filled
  const progressPercent = React.useMemo(() => {
    if (isExpired) return 100;
    if (daysLeft >= 30) return 12;
    return Math.max(15, Math.min(100, Math.round(((30 - daysLeft) / 30) * 100)));
  }, [daysLeft, isExpired]);

  // Standalone badge variant
  if (variant === "badge") {
    if (isExpired) {
      return (
        <Badge variant="outline" className={cn("text-[10px] bg-muted text-muted-foreground border-border", className)}>
          Expired
        </Badge>
      );
    }

    if (isCritical) {
      return (
        <Badge
          suppressHydrationWarning
          className={cn(
            "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 text-[10px] font-semibold gap-1.5 px-2 py-0.5",
            className
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <Flame className="h-3 w-3 animate-pulse text-red-600 dark:text-red-400" />
          <span>{daysLeft === 0 ? "Closes Today!" : `Urgent: ${daysLeft}d left`}</span>
        </Badge>
      );
    }

    if (isUrgent) {
      return (
        <Badge
          suppressHydrationWarning
          className={cn(
            "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold gap-1.5 px-2 py-0.5",
            className
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <Timer className="h-3 w-3 animate-pulse text-amber-600 dark:text-amber-400" />
          <span>Closing soon: {daysLeft}d</span>
        </Badge>
      );
    }

    return (
      <Badge
        suppressHydrationWarning
        variant={isApproaching ? "secondary" : "outline"}
        className={cn("text-[10px] px-1.5 py-0 font-medium", className)}
      >
        <Clock className="h-2.5 w-2.5 mr-1 text-muted-foreground" />
        {daysLeft}d left
      </Badge>
    );
  }

  // Compact variant (ideal for tighter cards / dashboard recommendation grid)
  if (variant === "compact") {
    return (
      <div className={cn("space-y-1.5 pt-1", className)}>
        <div className="flex items-center justify-between text-xs gap-1.5">
          <div className="flex items-center gap-1 text-muted-foreground truncate">
            {isCritical ? (
              <Flame className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0 animate-pulse" />
            ) : isUrgent ? (
              <Timer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate">{showDate ? formattedDate : "Deadline"}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isWithin7Days && (
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    isCritical ? "bg-red-400" : "bg-amber-400"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    isCritical ? "bg-red-500" : "bg-amber-500"
                  )}
                />
              </span>
            )}
            <Badge
              suppressHydrationWarning
              className={cn(
                "text-[10px] px-1.5 py-0 font-semibold tracking-tight",
                isCritical
                  ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                  : isUrgent
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                  : isApproaching
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  : "bg-muted text-muted-foreground border-border/60"
              )}
            >
              {isExpired ? "Expired" : daysLeft === 0 ? "Today!" : `${daysLeft}d left`}
            </Badge>
          </div>
        </div>

        {/* Dynamic urgency progress bar */}
        <div className="space-y-0.5">
          <div className="h-1.5 w-full bg-muted/60 dark:bg-muted/40 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isCritical
                  ? "bg-gradient-to-r from-red-500 to-rose-600"
                  : isUrgent
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : isApproaching
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                  : "bg-emerald-500"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {isWithin7Days && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
              <span className={cn("font-medium", isCritical ? "text-red-600 dark:text-red-400 font-semibold" : "text-amber-600 dark:text-amber-400")}>
                {isCritical ? "Final days to apply" : "Closes this week"}
              </span>
              <span className="tabular-nums font-mono text-[9px] opacity-75">{progressPercent}% elapsed</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detailed variant (for directory cards and recommendations page)
  return (
    <div
      className={cn(
        "rounded-lg p-2.5 transition-all text-xs space-y-2 border",
        isCritical
          ? "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-100"
          : isUrgent
          ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
          : isApproaching
          ? "bg-blue-500/5 border-blue-500/20 text-foreground"
          : "bg-muted/30 border-border/50 text-foreground",
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Dynamic pulsing icon indicator for deadlines within 7 days */}
          {isCritical ? (
            <div className="relative flex items-center justify-center p-1 rounded-md bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
              <span className="animate-ping absolute h-3.5 w-3.5 rounded-full bg-red-400 opacity-60" />
              <Flame className="h-4 w-4 relative z-10 animate-pulse" />
            </div>
          ) : isUrgent ? (
            <div className="relative flex items-center justify-center p-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <span className="animate-ping absolute h-3.5 w-3.5 rounded-full bg-amber-400 opacity-60" />
              <Timer className="h-4 w-4 relative z-10 animate-pulse" />
            </div>
          ) : (
            <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 font-semibold leading-tight">
              {isCritical ? (
                <span className="text-red-700 dark:text-red-300 flex items-center gap-1">
                  <span>Urgent Deadline</span>
                  <span className="text-[10px] font-normal opacity-90">• Closes in {daysLeft} {daysLeft === 1 ? "day" : "days"}!</span>
                </span>
              ) : isUrgent ? (
                <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <span>Closing This Week</span>
                  <span className="text-[10px] font-normal opacity-90">• {daysLeft} days left</span>
                </span>
              ) : (
                <span className="text-foreground">Application Deadline</span>
              )}
            </div>
            {showDate && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </p>
            )}
          </div>
        </div>

        {/* Days Left Badge */}
        <Badge
          suppressHydrationWarning
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 shrink-0 shadow-none",
            isCritical
              ? "bg-red-600 text-white hover:bg-red-700"
              : isUrgent
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : isApproaching
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {isExpired ? "Expired" : daysLeft === 0 ? "Last Chance Today!" : `${daysLeft} days left`}
        </Badge>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-background/80 dark:bg-muted/50 rounded-full overflow-hidden border border-border/30">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              isCritical
                ? "bg-gradient-to-r from-red-500 via-rose-500 to-red-600"
                : isUrgent
                ? "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500"
                : isApproaching
                ? "bg-gradient-to-r from-blue-400 to-indigo-500"
                : "bg-emerald-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span className="flex items-center gap-1">
            {isWithin7Days ? (
              <span className={cn("font-medium", isCritical ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
                ⚡ Hurry, apply before 11:59 PM IST
              </span>
            ) : (
              <span>Window Progress</span>
            )}
          </span>
          <span className="tabular-nums font-mono opacity-80">{progressPercent}% timeline reached</span>
        </div>
      </div>
    </div>
  );
}
