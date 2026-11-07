"use client";

import React, { useState, useEffect } from "react";
import type { Scholarship } from "@/lib/data";
import {
  CalendarEventData,
  getGoogleCalendarUrl,
  downloadIcsFile,
  triggerSystemNotification,
} from "@/lib/calendar";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { daysUntil } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Calendar,
  CalendarPlus,
  Download,
  ExternalLink,
  Check,
  Clock,
  Trash2,
  BellRing,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SetReminderButton({
  scholarship,
  variant = "default",
  size = "default",
  className,
}: {
  scholarship: Scholarship;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const { toast } = useToast();
  const tracker = useApplicationTracker();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIntervals, setSelectedIntervals] = useState<number[]>([7, 3, 1]);
  const [customDays, setCustomDays] = useState<string>("");
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  const daysLeft = daysUntil(scholarship.deadline);
  const activeReminder = tracker.getReminder(scholarship.id);

  useEffect(() => {
    if (activeReminder) {
      setSelectedIntervals(activeReminder.intervalsDays);
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [activeReminder, isOpen]);

  const toggleInterval = (days: number) => {
    setSelectedIntervals((prev) =>
      prev.includes(days) ? prev.filter((d) => d !== days) : [...prev, days].sort((a, b) => b - a)
    );
  };

  const addCustomInterval = () => {
    const parsed = parseInt(customDays, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 180) {
      if (!selectedIntervals.includes(parsed)) {
        setSelectedIntervals((prev) => [...prev, parsed].sort((a, b) => b - a));
      }
      setCustomDays("");
    }
  };

  const primaryDaysBefore = selectedIntervals[0] ?? 3;

  const eventData: CalendarEventData = {
    title: scholarship.title,
    description: `${scholarship.description}\nRequired Docs: ${(scholarship.required_documents || []).join(", ")}`,
    deadline: scholarship.deadline,
    provider: scholarship.provider,
    applyLink: scholarship.apply_link || scholarship.link,
    reminderDaysBefore: primaryDaysBefore,
  };

  const handleSaveInAppReminder = () => {
    const intervals = selectedIntervals.length > 0 ? selectedIntervals : [7, 3, 1];
    tracker.scheduleReminder({
      scholarshipId: String(scholarship.id),
      scholarshipTitle: scholarship.title,
      deadline: scholarship.deadline,
      intervalsDays: intervals,
      channels: {
        inApp: true,
        browserPush: notificationPermission === "granted",
        calendarExported: activeReminder?.channels.calendarExported || false,
      },
    });
    toast({
      title: "Automated Reminder Scheduled",
      description: `Configured ${intervals.map((d) => `${d}d`).join(", ")} alerts before ${scholarship.deadline}. Reminders stop automatically once marked Submitted.`,
    });
  };

  const handleOpenGoogleCalendarTemplate = () => {
    const url = getGoogleCalendarUrl(eventData);
    window.open(url, "_blank", "noopener,noreferrer");
    const intervals = selectedIntervals.length > 0 ? selectedIntervals : [7, 3, 1];
    tracker.scheduleReminder({
      scholarshipId: String(scholarship.id),
      scholarshipTitle: scholarship.title,
      deadline: scholarship.deadline,
      intervalsDays: intervals,
      channels: {
        inApp: true,
        browserPush: notificationPermission === "granted",
        calendarExported: true,
      },
    });
    toast({
      title: "Opened Google Calendar Event Template",
      description: "Please click 'Save' inside the newly opened Google Calendar tab to finalize adding the event to your calendar.",
    });
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(eventData);
    const intervals = selectedIntervals.length > 0 ? selectedIntervals : [7, 3, 1];
    tracker.scheduleReminder({
      scholarshipId: String(scholarship.id),
      scholarshipTitle: scholarship.title,
      deadline: scholarship.deadline,
      intervalsDays: intervals,
      channels: {
        inApp: true,
        browserPush: notificationPermission === "granted",
        calendarExported: true,
      },
    });
    toast({
      title: "Calendar File (.ics) Downloaded",
      description: "Open the downloaded .ics file to import this deadline into Apple Calendar, Outlook, or your phone.",
    });
  };

  const handleTriggerSystemNotification = async () => {
    const intervals = selectedIntervals.length > 0 ? selectedIntervals : [7, 3, 1];
    const res = await triggerSystemNotification({
      title: `Scholarship Alert Configured: ${scholarship.title}`,
      body: `Deadline: ${scholarship.deadline} (${daysLeft} days left). Scheduled alerts: ${intervals.join(", ")} days prior.`,
    });

    if (res.status === "granted") {
      setNotificationPermission("granted");
      tracker.scheduleReminder({
        scholarshipId: String(scholarship.id),
        scholarshipTitle: scholarship.title,
        deadline: scholarship.deadline,
        intervalsDays: intervals,
        channels: {
          inApp: true,
          browserPush: true,
          calendarExported: activeReminder?.channels.calendarExported || false,
        },
      });
      toast({
        title: "Browser Push + In-App Alerts Active",
        description: `We will alert you ${intervals.join(", ")} days before ${scholarship.deadline}.`,
      });
    } else if (res.status === "denied") {
      setNotificationPermission("denied");
      handleSaveInAppReminder();
      toast({
        title: "Saved to In-App Notification Center",
        description: "Browser push notifications are blocked by your browser, so alerts are active in your In-App Notification Center.",
      });
    } else {
      handleSaveInAppReminder();
    }
  };

  const handleRemoveReminder = () => {
    tracker.cancelReminder(scholarship.id);
    toast({
      title: "Reminder Cancelled",
      description: `Removed automated alerts for ${scholarship.title}.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={activeReminder ? "secondary" : variant}
          size={size}
          className={cn(
            "inline-flex items-center gap-2 font-medium cursor-pointer transition-all",
            activeReminder && "border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20",
            className
          )}
        >
          {activeReminder ? (
            <>
              <BellRing className="h-4 w-4 text-primary" />
              <span>Alerts On ({activeReminder.intervalsDays.join("/")}d)</span>
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              <span>Set Reminder</span>
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Automated Deadline Alert & Calendar</DialogTitle>
          </div>
          <DialogDescription>
            Configure multi-interval alerts for <strong>{scholarship.title}</strong>. Alerts automatically pause once your application is marked <em>Submitted</em>.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-muted/60 rounded-lg border flex items-center justify-between text-sm">
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">{scholarship.provider}</p>
            <p className="text-xs text-muted-foreground">Official Deadline: {scholarship.deadline}</p>
          </div>
          <Badge variant={daysLeft <= 14 ? "destructive" : "secondary"}>
            <Clock className="h-3 w-3 mr-1" />
            {daysLeft > 0 ? `${daysLeft} days left` : "Closed"}
          </Badge>
        </div>

        {/* Multi-Interval Checkboxes + Custom Days */}
        <div className="space-y-2.5 pt-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Alert Intervals (Select Multiple)
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { days: 7, label: "7 Days Before", desc: "Document check" },
              { days: 3, label: "3 Days Before", desc: "Portal upload" },
              { days: 1, label: "1 Day Before", desc: "Final submit" },
            ].map((opt) => {
              const checked = selectedIntervals.includes(opt.days);
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => toggleInterval(opt.days)}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-lg border text-xs transition-colors text-left",
                    checked
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <span className="font-semibold text-foreground flex items-center justify-between w-full">
                    {opt.label}
                    {checked && <Check className="h-3.5 w-3.5 text-primary" />}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Input
              type="number"
              min={0}
              max={180}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="Custom interval (e.g. 14 days before)"
              className="h-8 text-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={addCustomInterval} className="h-8 text-xs shrink-0">
              Add Custom
            </Button>
          </div>
          {selectedIntervals.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Active intervals: <strong>{selectedIntervals.map((d) => `${d} day(s)`).join(", ")}</strong> before deadline.
            </p>
          )}
        </div>

        <div className="space-y-2.5 pt-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Save Alert & Export to Calendar
          </Label>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="default"
              className="w-full justify-between h-auto py-2.5 px-3.5"
              onClick={handleTriggerSystemNotification}
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    Activate In-App & Browser Push Reminders
                  </p>
                  <p className="text-[11px] opacity-90">
                    Saves multi-interval alerts to your ScholarAI account
                  </p>
                </div>
              </div>
              <Check className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-auto py-2.5 px-3.5 hover:border-primary hover:bg-primary/5 group"
              onClick={handleOpenGoogleCalendarTemplate}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                    Open Google Calendar Event Template
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Opens pre-filled Google Calendar tab (click Save in Google Calendar)
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-auto py-2.5 px-3.5 hover:border-primary hover:bg-primary/5 group"
              onClick={handleDownloadIcs}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
                  <Download className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                    Download .ICS Calendar File
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Works offline with Apple Calendar, Outlook & mobile calendars
                  </p>
                </div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </Button>
          </div>
        </div>

        {activeReminder && (
          <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>
                Scheduled for <strong>{activeReminder.intervalsDays.join(", ")} day(s)</strong> prior.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveReminder}
              className="text-destructive hover:underline flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="h-3 w-3" />
              Cancel
            </button>
          </div>
        )}

        <DialogFooter className="sm:justify-between items-center pt-2">
          <p className="text-[11px] text-muted-foreground">
            Official portal link & document checklist included.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
