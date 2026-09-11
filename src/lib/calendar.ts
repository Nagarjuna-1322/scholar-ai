/**
 * Utility functions for calendar integration and system notifications.
 */

function formatDateToIcs(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export interface CalendarEventData {
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  provider: string;
  applyLink: string;
  reminderDaysBefore?: number;
}

/**
 * Builds a direct web URL to add the deadline to Google Calendar.
 */
export function getGoogleCalendarUrl(data: CalendarEventData): string {
  const parts = data.deadline.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const startDate = new Date(Date.UTC(year, month, day));
  const endDate = new Date(Date.UTC(year, month, day + 1));

  const startStr = startDate.toISOString().slice(0, 10).replace(/-/g, "");
  const endStr = endDate.toISOString().slice(0, 10).replace(/-/g, "");

  const eventTitle = encodeURIComponent(`Scholarship Deadline: ${data.title}`);
  const details = encodeURIComponent(
    `Application Deadline for ${data.title}\n\n` +
      `Provider: ${data.provider}\n` +
      `Official Portal: ${data.applyLink}\n\n` +
      `About:\n${data.description}`
  );
  const location = encodeURIComponent(`${data.provider} Portal`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

/**
 * Generates and downloads an .ics file compatible with Apple Calendar, Outlook, and mobile calendar apps.
 */
export function downloadIcsFile(data: CalendarEventData): void {
  const parts = data.deadline.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const start = new Date(year, month, day, 9, 0, 0);
  const end = new Date(year, month, day, 18, 0, 0);
  const now = new Date();

  const alarmDays = data.reminderDaysBefore ?? 1;
  const uid = `scholarship-${data.title.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15)}-${Date.now()}@scholarai.app`;

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScholarAI//Scholarship Application Deadline Reminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDateToIcs(now)}`,
    `DTSTART:${formatDateToIcs(start)}`,
    `DTEND:${formatDateToIcs(end)}`,
    `SUMMARY:${escapeIcsText(`Deadline: ${data.title}`)}`,
    `DESCRIPTION:${escapeIcsText(
      `Application deadline for ${data.title}.\nProvider: ${data.provider}\nApply Link: ${data.applyLink}\n\n${data.description}`
    )}`,
    `URL:${data.applyLink}`,
    `LOCATION:${escapeIcsText(`${data.provider} Portal`)}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`Reminder: ${data.title} application deadline is in ${alarmDays} day(s)!`)}`,
    `TRIGGER:-P${alarmDays}D`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([icsLines.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const cleanTitle = data.title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 24);
  anchor.href = url;
  anchor.download = `${cleanTitle}_deadline.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Requests browser permission and sends or schedules a system notification.
 */
export async function triggerSystemNotification({
  title,
  body,
}: {
  title: string;
  body: string;
}): Promise<{ status: "granted" | "denied" | "unsupported" }> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { status: "unsupported" };
  }

  let permission: NotificationPermission = Notification.permission;

  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `scholarship-deadline-${Date.now()}`,
      });
      return { status: "granted" };
    } catch {
      return { status: "granted" };
    }
  }

  return { status: permission === "denied" ? "denied" : "unsupported" };
}
