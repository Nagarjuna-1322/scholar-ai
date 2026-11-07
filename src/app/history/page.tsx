"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { type Scholarship } from "@/lib/data";
import { useScholarships } from "@/contexts/ScholarshipContext";
import {
  useApplicationTracker,
  ApplicationStatus,
  ALL_APPLICATION_STATUSES,
} from "@/contexts/ApplicationTrackerContext";
import {
  ScholarshipStatusTracker,
  StatusBadge,
} from "@/components/ScholarshipStatusTracker";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Send,
  Trophy,
  History as HistoryIcon,
  Search,
  Eye,
  ArrowUpRight,
  Bot,
  Lightbulb,
  Bell,
  Trash2,
  Clock,
} from "lucide-react";
import { daysUntil } from "@/lib/utils";

export default function HistoryPage() {
  const { scholarships } = useScholarships();
  const { applications, reminders, cancelReminder } = useApplicationTracker();
  const [activeTab, setActiveTab] = useState<"All" | ApplicationStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  const trackedScholarships = useMemo(() => {
    const list: Array<{
      scholarship: Scholarship;
      status: ApplicationStatus;
      updatedAt: string;
      referenceId?: string;
      verificationState?: string;
    }> = [];

    for (const [idStr, record] of Object.entries(applications)) {
      const scholarship = scholarships.find((s) => String(s.id) === String(idStr));
      if (scholarship && record.status) {
        list.push({
          scholarship,
          status: record.status,
          updatedAt: record.updatedAt,
          referenceId: record.applicationReferenceId,
          verificationState: record.verificationState,
        });
      }
    }

    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [applications, scholarships]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { All: trackedScholarships.length };
    for (const st of ALL_APPLICATION_STATUSES) {
      counts[st] = 0;
    }
    for (const item of trackedScholarships) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }
    return counts;
  }, [trackedScholarships]);

  const filteredList = useMemo(() => {
    return trackedScholarships.filter((item) => {
      const matchesTab = activeTab === "All" || item.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.scholarship.title.toLowerCase().includes(q) ||
        item.scholarship.provider.toLowerCase().includes(q) ||
        (item.referenceId && item.referenceId.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [trackedScholarships, activeTab, searchQuery]);

  const handleOpenDetail = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
            10-Stage Smart Application Tracker & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track applications from Saved → Preparing Documents → Ready to Apply → Application Started → Submitted → Under Review → Shortlisted → Awarded / Rejected / Withdrawn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/ai-matcher">
              <Bot className="h-4 w-4 text-primary" />
              <span>Eligibility Engine</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs">
            <Link href="/dashboard">
              <Lightbulb className="h-4 w-4" />
              <span>Discover More</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setActiveTab("All")}>
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Tracked</CardTitle>
            <HistoryIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono">{stats.All}</div>
            <p className="text-[11px] text-muted-foreground">Across all 10 stages</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setActiveTab("Preparing Documents")}>
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-indigo-600">Preparing & Started</CardTitle>
            <Clock className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
              {(stats["Saved"] || 0) +
                (stats["Preparing Documents"] || 0) +
                (stats["Ready to Apply"] || 0) +
                (stats["Application Started"] || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground">Pre-submission stages</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setActiveTab("Submitted")}>
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-violet-600">Submitted & Review</CardTitle>
            <Send className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-violet-700 dark:text-violet-300">
              {(stats["Submitted"] || 0) +
                (stats["Under Review"] || 0) +
                (stats["Shortlisted / Interview"] || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground">Confirmed portal submissions</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setActiveTab("Awarded")}>
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-600">Awarded</CardTitle>
            <Trophy className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {stats["Awarded"] || 0}
            </div>
            <p className="text-[11px] text-muted-foreground">Sanctioned scholarships</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Automated Reminders Section */}
      {reminders.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              Scheduled Multi-Interval Deadline Alerts ({reminders.filter((r) => r.active).length} Active)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {reminders.map((rem) => (
                <div
                  key={rem.scholarshipId}
                  className="p-2.5 rounded-lg border bg-card flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{rem.scholarshipTitle}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Deadline: {rem.deadline} • Alerts: {rem.intervalsDays.join(", ")}d prior
                    </p>
                    <Badge
                      variant={rem.active ? "secondary" : "outline"}
                      className="text-[9px] mt-1 px-1.5 py-0"
                    >
                      {rem.active ? "Active Alert" : "Paused (Application Submitted)"}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => cancelReminder(rem.scholarshipId)}
                    className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                    title="Remove reminder"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 10-Stage Filter Pills & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-muted/60 rounded-lg text-xs">
          {(["All", ...ALL_APPLICATION_STATUSES] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground bg-background/60"
              }`}
            >
              <span>{tab}</span>
              <span className="text-[10px] opacity-80 font-mono">({stats[tab] || 0})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tracked scholarships or Ref ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Tracked Applications List */}
      {filteredList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <HistoryIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold">
                {stats.All === 0
                  ? "No applications tracked yet"
                  : `No applications in "${activeTab}" stage`}
              </h3>
              <p className="text-xs text-muted-foreground">
                Select any stage (Saved, Preparing Documents, Application Started, Submitted, etc.) on a scholarship card to track your progress, store your official Application Reference ID, and log portal receipts.
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link href="/dashboard">Explore Verified Scholarships</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredList.map(({ scholarship, status }) => (
            <Card key={scholarship.id} className="overflow-hidden border shadow-2xs">
              <CardHeader className="pb-3 border-b bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base sm:text-lg font-headline">
                        {scholarship.title}
                      </CardTitle>
                      <StatusBadge status={status} />
                      <Badge variant="outline" className="font-mono text-xs">
                        ₹{scholarship.amount.toLocaleString("en-IN")}/yr
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <span>{scholarship.provider}</span>
                      <span>•</span>
                      <span>Deadline: {scholarship.deadline} ({daysUntil(scholarship.deadline)} days left)</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDetail(scholarship)}
                      className="gap-1 text-xs h-8"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Checklist & AI Guide
                    </Button>
                    <Button asChild size="sm" variant="secondary" className="gap-1 text-xs h-8">
                      <a
                        href={scholarship.apply_link || scholarship.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Portal
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <ScholarshipStatusTracker
                  scholarshipId={scholarship.id}
                  scholarshipTitle={scholarship.title}
                  variant="full"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ScholarshipDetail
        scholarship={selectedScholarship}
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
