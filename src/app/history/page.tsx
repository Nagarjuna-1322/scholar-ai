"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { sampleScholarships, type Scholarship } from "@/lib/data";
import {
  useApplicationTracker,
  ApplicationStatus,
} from "@/contexts/ApplicationTrackerContext";
import {
  ScholarshipStatusTracker,
  StatusBadge,
  STATUS_METADATA,
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
  CalendarCheck,
  Trophy,
  History as HistoryIcon,
  Search,
  Eye,
  ArrowUpRight,
  Sparkles,
  Bot,
  Lightbulb,
} from "lucide-react";
import { daysUntil } from "@/lib/utils";

export default function HistoryPage() {
  const { applications } = useApplicationTracker();
  const [activeTab, setActiveTab] = useState<"All" | ApplicationStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  // Combine tracked applications with scholarship information
  const trackedScholarships = useMemo(() => {
    const list: Array<{
      scholarship: Scholarship;
      status: ApplicationStatus;
      updatedAt: string;
    }> = [];

    for (const [idStr, record] of Object.entries(applications)) {
      const id = Number(idStr);
      const scholarship = sampleScholarships.find((s) => s.id === id);
      if (scholarship && record.status) {
        list.push({
          scholarship,
          status: record.status,
          updatedAt: record.updatedAt,
        });
      }
    }

    // Sort by latest update first
    return list.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [applications]);

  // Statistics
  const stats = useMemo(() => {
    let applied = 0;
    let interviewing = 0;
    let awarded = 0;

    for (const item of trackedScholarships) {
      if (item.status === "Applied") applied++;
      if (item.status === "Interviewing") interviewing++;
      if (item.status === "Awarded") awarded++;
    }

    return {
      total: trackedScholarships.length,
      applied,
      interviewing,
      awarded,
    };
  }, [trackedScholarships]);

  // Filtered list
  const filteredList = useMemo(() => {
    return trackedScholarships.filter((item) => {
      const matchesTab = activeTab === "All" || item.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.scholarship.title.toLowerCase().includes(q) ||
        item.scholarship.provider.toLowerCase().includes(q) ||
        item.scholarship.tags.some((t) => t.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [trackedScholarships, activeTab, searchQuery]);

  const handleOpenDetail = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Tracker & History</h1>
          <p className="text-muted-foreground mt-1">
            Track and update your scholarship progress through each milestone: Applied, Interviewing, and Awarded.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/ai-matcher">
              <Bot className="h-4 w-4 text-primary" />
              <span>AI Matcher</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/recommendations">
              <Lightbulb className="h-4 w-4" />
              <span>Find More</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Tracked */}
        <Card
          className="cursor-pointer transition-all hover:border-primary/50"
          onClick={() => setActiveTab("All")}
        >
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Tracked
            </CardTitle>
            <HistoryIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground">Scholarships in pipeline</p>
          </CardContent>
        </Card>

        {/* Applied */}
        <Card
          className={`cursor-pointer transition-all hover:border-blue-400 ${
            activeTab === "Applied" ? "ring-2 ring-blue-500/20 border-blue-500" : ""
          }`}
          onClick={() => setActiveTab("Applied")}
        >
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Applied
            </CardTitle>
            <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.applied}
            </div>
            <p className="text-[11px] text-muted-foreground">Under initial review</p>
          </CardContent>
        </Card>

        {/* Interviewing */}
        <Card
          className={`cursor-pointer transition-all hover:border-amber-400 ${
            activeTab === "Interviewing" ? "ring-2 ring-amber-500/20 border-amber-500" : ""
          }`}
          onClick={() => setActiveTab("Interviewing")}
        >
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Interviewing
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {stats.interviewing}
            </div>
            <p className="text-[11px] text-muted-foreground">Interview / shortlist</p>
          </CardContent>
        </Card>

        {/* Awarded */}
        <Card
          className={`cursor-pointer transition-all hover:border-emerald-400 ${
            activeTab === "Awarded" ? "ring-2 ring-emerald-500/20 border-emerald-500" : ""
          }`}
          onClick={() => setActiveTab("Awarded")}
        >
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Awarded
            </CardTitle>
            <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {stats.awarded}
            </div>
            <p className="text-[11px] text-muted-foreground">Won & granted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="inline-flex p-1 bg-muted rounded-lg text-xs font-medium self-start">
          {(["All", "Applied", "Interviewing", "Awarded"] as const).map((tab) => {
            const count =
              tab === "All"
                ? stats.total
                : tab === "Applied"
                ? stats.applied
                : tab === "Interviewing"
                ? stats.interviewing
                : stats.awarded;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab
                      ? "bg-primary/10 text-primary"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tracked scholarships..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-9"
          />
        </div>
      </div>

      {/* Tracked Applications List or Empty State */}
      {filteredList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <HistoryIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold">
                {stats.total === 0
                  ? "No applications tracked yet"
                  : `No applications with status "${activeTab}"`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stats.total === 0
                  ? "Mark scholarships as 'Applied', 'Interviewing', or 'Awarded' from the AI Matcher or Recommendations tabs to track them here."
                  : `You don't have any scholarships marked as "${activeTab}" right now. Switch tabs or mark a scholarship to see it here.`}
              </p>
              <div className="pt-3 flex flex-wrap gap-2 justify-center">
                <Button asChild variant="default" size="sm" className="gap-1.5">
                  <Link href="/recommendations">
                    <Lightbulb className="h-4 w-4" />
                    Browse Recommendations
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href="/ai-matcher">
                    <Bot className="h-4 w-4 text-primary" />
                    AI Scholarship Matcher
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredList.map(({ scholarship, status }) => (
            <Card key={scholarship.id} className="overflow-hidden border shadow-sm">
              <CardHeader className="pb-3 border-b bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <CardTitle className="text-lg font-headline">
                        {scholarship.title}
                      </CardTitle>
                      <StatusBadge status={status} />
                    </div>
                    <CardDescription className="flex items-center gap-2">
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
                      className="gap-1 text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </Button>
                    <Button asChild size="sm" variant="secondary" className="gap-1 text-xs">
                      <a
                        href={scholarship.apply_link}
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
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {scholarship.description}
                </p>

                {/* Embedded Full Stepper Tracker */}
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

      {/* Scholarship Detail Modal */}
      <ScholarshipDetail
        scholarship={selectedScholarship}
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
