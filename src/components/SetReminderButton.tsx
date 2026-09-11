"use client";

import React, { useState, useEffect } from "react";
import type { Scholarship } from "@/lib/data";
import {
  CalendarEventData,
  getGoogleCalendarUrl,
  downloadIcsFile,
  triggerSystemNotification,
} from "@/lib/calendar";
import { daysUntil } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface StoredReminder {
  scholarshipId: number;
  daysBefore: number;
  channels: {
    calendar?: boolean;
    systemNotification?: boolean;
  };
  setAt: string;
}

const STORAGE_KEY = "scholarai_saved_reminders";

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
  const [isOpen, setIsOpen] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(1);
  const [activeReminder, setActiveReminder] = useState<StoredReminder | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  const daysLeft = daysUntil(scholarship.deadline);

  // Load existing reminder state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Record<number, StoredReminder> = JSON.parse(raw);
        if (parsed[scholarship.id]) {
          setActiveReminder(parsed[scholarship.id]);
          setReminderDays(parsed[scholarship.id].daysBefore);
        } else {
          setActiveReminder(null);
        }
      }
    } catch (e) {
      console.error("Failed to parse stored reminders:", e);
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [scholarship.id, isOpen]);

  const saveReminderToStorage = (daysBefore: number, channel: "calendar" | "systemNotification") => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map: Record<number, StoredReminder> = raw ? JSON.parse(raw) : {};

      const existing = map[scholarship.id] || {
        scholarshipId: scholarship.id,
        daysBefore,
        channels: {},
        setAt: new Date().toISOString(),
      };

      existing.daysBefore = daysBefore;
      existing.channels[channel] = true;
      existing.setAt = new Date().toISOString();

      map[scholarship.id] = existing;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      setActiveReminder(existing);
    } catch (e) {
      console.error("Failed to save reminder:", e);
    }
  };

  const removeReminder = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const map: Record<number, StoredReminder> = JSON.parse(raw);
        delete map[scholarship.id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      }
      setActiveReminder(null);
      toast({
        title: "Reminder Removed",
        description: `Cancelled reminder for ${scholarship.title}.`,
      });
    } catch (e) {
      console.error("Failed to remove reminder:", e);
    }
  };

  const eventData: CalendarEventData = {
    title: scholarship.title,
    description: scholarship.description,
    deadline: scholarship.deadline,
    provider: scholarship.provider,
    applyLink: scholarship.apply_link,
    reminderDaysBefore: reminderDays,
  };

  // 1. Google Calendar Handler
  const handleAddToGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(eventData);
    window.open(url, "_blank", "noopener,noreferrer");
    saveReminderToStorage(reminderDays, "calendar");
    toast({
      title: "Opening Google Calendar",
      description: "Added deadline event with reminder details to your Google Calendar.",
    });
  };

  // 2. Apple / Outlook (.ics) Handler
  const handleDownloadIcs = () => {
    downloadIcsFile(eventData);
    saveReminderToStorage(reminderDays, "calendar");
    toast({
      title: "Calendar File Downloaded",
      description: "Open the downloaded .ics file to add the event to Apple Calendar, Outlook, or your device calendar.",
    });
  };

  // 3. System Notification Handler
  const handleTriggerSystemNotification = async () => {
    const reminderDateText =
      reminderDays === 0
        ? "on the deadline date"
        : `${reminderDays} day${reminderDays > 1 ? "s" : ""} before the deadline`;

    const res = await triggerSystemNotification({
      title: `Scholarship Reminder Set: ${scholarship.title}`,
      body: `Deadline: ${scholarship.deadline} (${daysLeft} days remaining). We'll remind you ${reminderDateText}!`,
    });

    if (res.status === "granted") {
      setNotificationPermission("granted");
      saveReminderToStorage(reminderDays, "systemNotification");
      toast({
        title: "System Notification Active",
        description: `Notification reminder scheduled for ${scholarship.title}.`,
      });
    } else if (res.status === "denied") {
      setNotificationPermission("denied");
      toast({
        variant: "destructive",
        title: "Notifications Blocked",
        description:
          "Browser notifications are currently blocked. Please allow notifications in your browser address bar settings.",
      });
    } else {
      toast({
        title: "Reminder Saved",
        description: `Reminder noted locally for ${scholarship.title}.`,
      });
    }
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
              <BellRing className="h-4 w-4 text-primary animate-pulse" />
              <span>Reminder Set</span>
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
            <DialogTitle className="text-lg font-bold">Set Application Deadline Reminder</DialogTitle>
          </div>
          <DialogDescription>
            Add <strong>{scholarship.title}</strong> to your calendar or configure system notifications so you never miss the deadline.
          </DialogDescription>
        </DialogHeader>

        {/* Scholarship Deadline Banner */}
        <div className="p-3 bg-muted/60 rounded-lg border flex items-center justify-between text-sm">
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">{scholarship.provider}</p>
            <p className="text-xs text-muted-foreground">Deadline: {scholarship.deadline}</p>
          </div>
          <Badge variant={daysLeft <= 14 ? "destructive" : "secondary"}>
            <Clock className="h-3 w-3 mr-1" />
            {daysLeft} days left
          </Badge>
        </div>

        {/* Reminder Timing Preference */}
        <div className="space-y-3 pt-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Remind Me
          </Label>
          <RadioGroup
            value={String(reminderDays)}
            onValueChange={(val) => setReminderDays(Number(val))}
            className="grid grid-cols-2 gap-2"
          >
            {[
              { days: 1, label: "1 Day Before", desc: "Best for final polish" },
              { days: 3, label: "3 Days Before", desc: "Recommended" },
              { days: 7, label: "1 Week Before", desc: "Great for essays" },
              { days: 0, label: "On Deadline Day", desc: "Last-chance submission" },
            ].map((opt) => (
              <label
                key={opt.days}
                htmlFor={`reminder-opt-${opt.days}`}
                className={cn(
                  "flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors",
                  reminderDays === opt.days
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <RadioGroupItem
                  value={String(opt.days)}
                  id={`reminder-opt-${opt.days}`}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground block">{opt.desc}</span>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Integration Actions */}
        <div className="space-y-3 pt-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Choose Destination
          </Label>

          <div className="grid gap-2">
            {/* 1. Google Calendar Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-auto py-2.5 px-3.5 hover:border-primary hover:bg-primary/5 group"
              onClick={handleAddToGoogleCalendar}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                    Google Calendar
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Open pre-filled event in browser
                  </p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </Button>

            {/* 2. Apple / Outlook / iCal Button */}
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
                    Apple / Outlook / iCal (.ics)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Download calendar file with alarm
                  </p>
                </div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </Button>

            {/* 3. System / Browser Notification Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between h-auto py-2.5 px-3.5 hover:border-primary hover:bg-primary/5 group"
              onClick={handleTriggerSystemNotification}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                      System Notifications
                    </p>
                    {notificationPermission === "granted" && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1 bg-emerald-50 text-emerald-700 border-emerald-300">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Native browser & desktop alert
                  </p>
                </div>
              </div>
              <Check className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </Button>
          </div>
        </div>

        {/* Existing Active Reminder Notice */}
        {activeReminder && (
          <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>
                Reminder configured for <strong>{activeReminder.daysBefore} day(s)</strong> before deadline.
              </span>
            </div>
            <button
              type="button"
              onClick={removeReminder}
              className="text-destructive hover:underline flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        )}

        <DialogFooter className="sm:justify-between items-center pt-2">
          <p className="text-[11px] text-muted-foreground">
            Events include link, requirements & provider info.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
