"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScholarshipChart } from "@/components/ScholarshipChart";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Scholarship, yearlyApplicationStats, topProviders } from "@/lib/data";
import { evaluateAndRankScholarships } from "@/lib/eligibilityEngine";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { daysUntil, cn } from "@/lib/utils";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import { StatusBadge } from "@/components/ScholarshipStatusTracker";
import { SetReminderButton } from "@/components/SetReminderButton";
import Link from "next/link";
import {
  Send,
  ArrowRight,
  History as HistoryIcon,
  ExternalLink,
  Eye,
  Building2,
  Landmark,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Globe,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Bookmark,
  Scale,
  FileSearch,
  Calculator,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { applications, setStatus, getStatus, reminders } = useApplicationTracker();
  const { profile, setProfileOpen, completionPercentage, missingFields } = useProfile();
  const {
    scholarships,
    expiredArchive,
    stats: scholarshipStats,
    setUpdateModalOpen,
    savedIds,
    toggleSavedScholarship,
    comparisonIds,
    toggleCompareScholarship,
  } = useScholarships();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");
  const [selectedEligibilityFilter, setSelectedEligibilityFilter] = useState<string>("all");
  const [selectedWindowStatus, setSelectedWindowStatus] = useState<string>("Open");
  const [sortBy, setSortBy] = useState<string>("compatibility");
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSearch = params.get("search") || params.get("q");
      if (urlSearch) {
        setSearchQuery(urlSearch);
        const directoryEl = document.getElementById("scholarship-directory-section");
        if (directoryEl) {
          setTimeout(() => {
            directoryEl.scrollIntoView({ behavior: "smooth" });
          }, 150);
        }
      }
    } catch {}

    const handleCustomSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail && typeof customEvent.detail.query === "string") {
        setSearchQuery(customEvent.detail.query);
      }
    };

    window.addEventListener("scholarai:set_search", handleCustomSearch);
    return () => window.removeEventListener("scholarai:set_search", handleCustomSearch);
  }, []);

  // Deterministic Eligibility Evaluation for all scholarships
  const evaluatedCatalog = useMemo(() => {
    return evaluateAndRankScholarships(profile, scholarships);
  }, [profile, scholarships]);

  const eligibleScholarships = useMemo(
    () => evaluatedCatalog.filter((x) => x.evaluation.status === "Eligible" && daysUntil(x.scholarship.deadline) > 0),
    [evaluatedCatalog]
  );

  const possiblyEligibleScholarships = useMemo(
    () => evaluatedCatalog.filter((x) => x.evaluation.status === "Possibly Eligible" && daysUntil(x.scholarship.deadline) > 0),
    [evaluatedCatalog]
  );

  const appStats = useMemo(() => {
    const values = Object.values(applications);
    return {
      submitted: values.filter((a) => a.status === "Submitted" || a.status === "Under Review" || a.status === "Shortlisted / Interview").length,
      inProgress: values.filter((a) => a.status === "Saved" || a.status === "Preparing Documents" || a.status === "Ready to Apply" || a.status === "Application Started").length,
      awarded: values.filter((a) => a.status === "Awarded").length,
      total: values.length,
    };
  }, [applications]);

  const filteredScholarships = useMemo(() => {
    return evaluatedCatalog
      .filter(({ scholarship: s, evaluation }) => {
        const dLeft = daysUntil(s.deadline);
        const windowState = dLeft <= 0 ? "Closed" : s.application_status || "Open";

        if (selectedWindowStatus === "Open" && windowState === "Closed") return false;
        if (selectedWindowStatus === "Closed" && windowState !== "Closed") return false;

        if (selectedEligibilityFilter === "Eligible" && evaluation.status !== "Eligible") return false;
        if (selectedEligibilityFilter === "Possibly Eligible" && evaluation.status !== "Possibly Eligible") return false;
        if (selectedEligibilityFilter === "Not Eligible" && evaluation.status !== "Not Eligible") return false;

        if (selectedCategory === "saved" && !savedIds.includes(String(s.id))) return false;
        if (selectedCategory === "government" && s.category !== "Government") return false;
        if (selectedCategory === "private" && s.category !== "Private") return false;
        if (selectedCategory === "stem" && !s.tags.includes("stem")) return false;
        if (selectedCategory === "women" && !s.tags.includes("women")) return false;
        if (selectedCategory === "merit" && !s.tags.includes("merit")) return false;

        if (selectedStateFilter !== "all") {
          const reg = s.region.toLowerCase();
          if (!reg.includes("all india") && !reg.includes(selectedStateFilter.toLowerCase())) {
            return false;
          }
        }

        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(query) ||
          s.provider.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.region.toLowerCase().includes(query) ||
          String(s.amount).includes(query) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          s.eligible_courses.some((c) => c.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (sortBy === "compatibility") {
          return b.evaluation.compatibilityScore - a.evaluation.compatibilityScore;
        }
        if (sortBy === "deadline") {
          return new Date(a.scholarship.deadline).getTime() - new Date(b.scholarship.deadline).getTime();
        }
        if (sortBy === "amount") {
          return b.scholarship.amount - a.scholarship.amount;
        }
        if (sortBy === "title") {
          return a.scholarship.title.localeCompare(b.scholarship.title);
        }
        return 0;
      });
  }, [
    evaluatedCatalog,
    selectedWindowStatus,
    selectedEligibilityFilter,
    selectedCategory,
    selectedStateFilter,
    savedIds,
    searchQuery,
    sortBy,
  ]);

  // CRITICAL: Clicking external Apply button sets "Application Started", never auto-submitting!
  const handleVisitOfficialPortal = (scholarship: Scholarship) => {
    const currentStatus = getStatus(scholarship.id);
    if (!currentStatus || currentStatus === "Saved" || currentStatus === "Preparing Documents" || currentStatus === "Ready to Apply") {
      setStatus(scholarship.id, "Application Started", scholarship.title);
    }
    toast({
      title: `Opened ${scholarship.provider} Official Portal`,
      description: `Marked as "Application Started". Confirm submission in your tracker once you complete the portal form.`,
    });
  };

  const handleOpenDetail = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Personalized Student Welcome Banner */}
      <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Verified Student Scholarships
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {profile.course} • {profile.state} • {profile.category}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
              {t("dashboard.greeting")}, {profile.name || "Student"}!
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
              {t("dashboard.subtitle")} {t("safety.noFeeWarning")}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Link href="/ai-matcher">
                <FileSearch className="h-3.5 w-3.5 text-indigo-600" />
                <span>Check Eligibility & Upload Resume</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Link href="/planner">
                <Calculator className="h-3.5 w-3.5 text-emerald-600" />
                <span>Fee & Aid Calculator</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Link href="/compare">
                <Scale className="h-3.5 w-3.5 text-amber-600" />
                <span>Compare ({comparisonIds.length}/4)</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="h-8 text-xs gap-1.5">
              <Link href="/history">
                <HistoryIcon className="h-3.5 w-3.5" />
                <span>My Applications ({appStats.total})</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Completion Strip */}
        <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">
                {t("dashboard.profileCompletion")}: <strong className="text-foreground font-mono">{completionPercentage}%</strong>
                {missingFields.length > 0 && ` (Add ${missingFields.slice(0, 2).join(", ")} for better matches)`}
              </span>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="text-primary font-semibold hover:underline"
              >
                Edit My Profile →
              </button>
            </div>
            <Progress value={completionPercentage} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* 4 High-Signal KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-200/70 dark:border-emerald-900/40">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              {t("dashboard.eligibleCount")}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {eligibleScholarships.length}
            </div>
            <p className="text-[11px] text-muted-foreground">
              +{possiblyEligibleScholarships.length} Possibly Eligible
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200/70 dark:border-indigo-900/40">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
              Verified Catalog
            </CardTitle>
            <Landmark className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-foreground">
              {scholarshipStats.totalActive} Open
            </div>
            <p className="text-[11px] text-muted-foreground">
              {scholarshipStats.govtCount} Govt • {scholarshipStats.privateCount} CSR ({expiredArchive.length} Archived)
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/70 dark:border-amber-900/40">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              {t("dashboard.savedScholarships")}
            </CardTitle>
            <Bookmark className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-foreground">
              {savedIds.length} Saved
            </div>
            <p className="text-[11px] text-muted-foreground">
              {reminders.filter((r) => r.active).length} Automated Deadline Alerts On
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-200/70 dark:border-violet-900/40">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-violet-800 dark:text-violet-300">
              {t("dashboard.activeApplications")}
            </CardTitle>
            <Send className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-foreground">
              {appStats.total} Tracked
            </div>
            <p className="text-[11px] text-muted-foreground">
              {appStats.inProgress} Preparing • {appStats.submitted} Submitted • {appStats.awarded} Awarded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: RECOMMENDED FOR YOU */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-headline tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Recommended Scholarships for You
            </h2>
            <p className="text-xs text-muted-foreground">
              Matched to your profile ({profile.course}, {profile.marks_percent}% marks, ₹{(profile.income ?? 0).toLocaleString("en-IN")} family income, {profile.state})
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="text-xs h-8 gap-1 self-start">
            <Link href="/recommendations">
              <span>View All Matches</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {eligibleScholarships.slice(0, 4).map(({ scholarship: s, evaluation }) => {
            const status = getStatus(s.id);
            const isSaved = savedIds.includes(String(s.id));
            const isCompared = comparisonIds.includes(String(s.id));

            return (
              <Card
                key={`rec-${s.id}`}
                className="flex flex-col justify-between hover:shadow-md transition-all border-border bg-card"
              >
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Eligible • {evaluation.compatibilityScore}% Match
                    </Badge>
                    <Badge variant="outline" className="font-mono font-bold text-primary text-xs">
                      ₹{s.amount.toLocaleString("en-IN")}/yr
                    </Badge>
                  </div>

                  <CardTitle className="text-base font-bold line-clamp-2 leading-snug">
                    {s.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {s.provider} • <span className="font-medium text-foreground">{s.region}</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 line-clamp-2">
                    ✓ {evaluation.matchedCriteria.slice(0, 2).join(" • ")}
                  </p>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-2.5">
                  <DeadlineIndicator deadline={s.deadline} variant="compact" />
                  {status && <StatusBadge status={status} />}

                  <div className="pt-2 border-t flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleSavedScholarship(s.id)}
                        className="h-7 px-2 text-xs"
                        title="Save scholarship"
                      >
                        <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current text-primary")} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleCompareScholarship(s.id)}
                        className={cn("h-7 px-2 text-xs", isCompared && "bg-indigo-50 text-indigo-700")}
                        title="Add to side-by-side comparison"
                      >
                        <Scale className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(s)}
                        className="text-xs h-7 px-2.5"
                      >
                        <Eye className="mr-1 h-3 w-3" /> {t("card.viewDetails")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ALL SCHOLARSHIPS DIRECTORY */}
      <div id="scholarship-directory-section" className="space-y-4 pt-6 border-t">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-headline tracking-tight">
              Browse All Scholarships
            </h2>
            <p className="text-xs text-muted-foreground">
              Showing {filteredScholarships.length} of {scholarships.length} verified scholarships • Filter by your eligibility, state, or category
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateModalOpen(true)}
              className="gap-1.5 text-xs h-8"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Past / Closed Scholarships ({expiredArchive.length})</span>
            </Button>
          </div>
        </div>

        {/* Multi-Dimensional Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 bg-muted/40 p-3 rounded-xl border">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search title, Telangana ePASS, AICTE, NSP, B.Tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background h-9 text-xs"
            />
          </div>

          {/* Eligibility Filter */}
          <Select value={selectedEligibilityFilter} onValueChange={setSelectedEligibilityFilter}>
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder="Eligibility Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Eligibility States</SelectItem>
              <SelectItem value="Eligible">✓ Eligible Only ({eligibleScholarships.length})</SelectItem>
              <SelectItem value="Possibly Eligible">⚠ Possibly Eligible ({possiblyEligibleScholarships.length})</SelectItem>
              <SelectItem value="Not Eligible">✕ Not Eligible</SelectItem>
            </SelectContent>
          </Select>

          {/* State / Domicile Filter */}
          <Select value={selectedStateFilter} onValueChange={setSelectedStateFilter}>
            <SelectTrigger className="bg-background h-9 text-xs">
              <SelectValue placeholder="State / Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All India + All States</SelectItem>
              <SelectItem value="Telangana">Telangana (ePASS + National)</SelectItem>
              <SelectItem value="Maharashtra">Maharashtra (MahaDBT + National)</SelectItem>
              <SelectItem value="Karnataka">Karnataka (SSP + National)</SelectItem>
              <SelectItem value="North Eastern">North Eastern Region (UGC)</SelectItem>
            </SelectContent>
          </Select>

          {/* Category / Saved Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-background h-9 text-xs">
              <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({scholarships.length})</SelectItem>
              <SelectItem value="saved">★ Saved Scholarships ({savedIds.length})</SelectItem>
              <SelectItem value="government">Government Schemes ({scholarshipStats.govtCount})</SelectItem>
              <SelectItem value="private">Corporate CSR ({scholarshipStats.privateCount})</SelectItem>
              <SelectItem value="stem">STEM & Engineering</SelectItem>
              <SelectItem value="women">Women in STEM</SelectItem>
              <SelectItem value="merit">Merit-Based</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-background h-9 text-xs">
              <TrendingUp className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compatibility">Highest Compatibility</SelectItem>
              <SelectItem value="deadline">Soonest Deadline</SelectItem>
              <SelectItem value="amount">Highest Grant Amount</SelectItem>
              <SelectItem value="title">Title (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Open vs Closed Archive Toggle Strip */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {(["Open", "Closed", "All"] as const).map((win) => (
              <button
                key={win}
                type="button"
                onClick={() => setSelectedWindowStatus(win)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium border transition-colors",
                  selectedWindowStatus === win
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {win === "Open" ? "Open Applications" : win === "Closed" ? "Closed / Past Deadline" : "All Windows"}
              </button>
            ))}
          </div>

          {(searchQuery || selectedCategory !== "all" || selectedStateFilter !== "all" || selectedEligibilityFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStateFilter("all");
                setSelectedEligibilityFilter("all");
                setSelectedWindowStatus("Open");
              }}
              className="h-7 text-xs"
            >
              Reset All Filters
            </Button>
          )}
        </div>

        {/* Scholarship Cards Grid */}
        {filteredScholarships.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <h3 className="text-base font-semibold">No scholarships match your current filter combination</h3>
            <p className="text-xs text-muted-foreground">
              Try resetting your state or eligibility filter to view all verified programs.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredScholarships.map(({ scholarship: s, evaluation }) => {
              const status = getStatus(s.id);
              const daysLeft = daysUntil(s.deadline);
              const isGovt = s.category === "Government";
              const isSaved = savedIds.includes(String(s.id));
              const isCompared = comparisonIds.includes(String(s.id));

              return (
                <Card
                  key={s.id}
                  className={cn(
                    "flex flex-col justify-between hover:shadow-md transition-all border-border bg-card",
                    daysLeft <= 7 && daysLeft > 0 && "border-amber-500/50"
                  )}
                >
                  <CardHeader className="p-5 pb-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={isGovt ? "default" : "secondary"}
                          className={
                            isGovt
                              ? "bg-emerald-700 text-white text-[10px]"
                              : "bg-indigo-700 text-white text-[10px]"
                          }
                        >
                          {isGovt ? "Govt / Public" : "Corporate CSR"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] gap-1 border-emerald-300 text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          {s.verification_status || "Verified Source"}
                        </Badge>
                      </div>
                      <SetReminderButton scholarship={s} size="sm" variant="ghost" />
                    </div>

                    <div>
                      <CardTitle className="text-base font-bold leading-snug line-clamp-2">
                        {s.title}
                      </CardTitle>
                      <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
                        {isGovt ? (
                          <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                        <span>{s.provider}</span>
                        <span>•</span>
                        <span>{s.region}</span>
                      </p>
                    </div>

                    {/* Amount + Deterministic Eligibility Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <Badge variant="outline" className="font-mono font-bold text-primary border-primary/40 bg-primary/5 text-xs">
                        ₹{s.amount.toLocaleString("en-IN")}/yr
                      </Badge>

                      {evaluation.status === "Eligible" ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t("status.eligible")} ({evaluation.compatibilityScore}%)
                        </Badge>
                      ) : evaluation.status === "Possibly Eligible" ? (
                        <Badge className="bg-amber-600 text-white text-[10px] font-mono">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {t("status.possiblyEligible")} ({evaluation.compatibilityScore}%)
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] font-mono">
                          <XCircle className="h-3 w-3 mr-1" />
                          {t("status.notEligible")}
                        </Badge>
                      )}
                    </div>

                    <CardDescription className="text-xs line-clamp-2 leading-relaxed">
                      {evaluation.summaryReason}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg">
                      <span>Income Limit: ₹{s.income_limit.toLocaleString("en-IN")}/yr</span>
                      <span className="text-[10px]">Verified: {s.last_verified_at || "2026-02-15"}</span>
                    </div>

                    <DeadlineIndicator deadline={s.deadline} variant="detailed" />

                    {status && (
                      <div className="pt-0.5">
                        <StatusBadge status={status} />
                      </div>
                    )}

                    <div className="pt-2.5 border-t flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={isSaved ? "secondary" : "outline"}
                          onClick={() => toggleSavedScholarship(s.id)}
                          className="h-8 px-2 text-xs"
                          title={isSaved ? "Remove from saved" : "Save scholarship"}
                        >
                          <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current text-primary")} />
                        </Button>
                        <Button
                          size="sm"
                          variant={isCompared ? "secondary" : "outline"}
                          onClick={() => toggleCompareScholarship(s.id)}
                          className="h-8 px-2 text-xs gap-1"
                          title="Compare side-by-side"
                        >
                          <Scale className="h-3.5 w-3.5 text-indigo-600" />
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(s)}
                        className="gap-1 text-xs h-8 px-2.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{t("card.viewDetails")}</span>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        className="gap-1 text-xs h-8 px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        <a
                          href={s.apply_link || s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleVisitOfficialPortal(s)}
                        >
                          <span>Portal</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: VERIFIED OFFICIAL INDIAN PORTALS */}
      <div className="space-y-3 pt-6 border-t">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold font-headline tracking-tight">
            Official National & State Scholarship Portals
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="https://scholarships.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 border rounded-xl bg-card hover:border-primary transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm group-hover:text-primary">National Scholarship Portal (NSP)</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">scholarships.gov.in • Central, UGC & AICTE schemes</p>
          </a>

          <a
            href="https://telanganaepass.cgg.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 border rounded-xl bg-card hover:border-primary transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm group-hover:text-primary">Telangana ePASS Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">telanganaepass.cgg.gov.in • RTF & MTF Post-Matric</p>
          </a>

          <a
            href="https://mahadbt.maharashtra.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 border rounded-xl bg-card hover:border-primary transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm group-hover:text-primary">MahaDBT Maharashtra Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">mahadbt.maharashtra.gov.in • State DBT schemes</p>
          </a>

          <a
            href="https://ssp.postmatric.karnataka.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 border rounded-xl bg-card hover:border-primary transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm group-hover:text-primary">Karnataka SSP Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">ssp.postmatric.karnataka.gov.in • State Post-Matric</p>
          </a>
        </div>
      </div>

      {/* SECTION 4: ANALYTICS & TOP CORPORATE CONTRIBUTORS */}
      <div className="grid md:grid-cols-2 gap-8 pt-6 border-t">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Annual Scholarship Disbursements (India)</CardTitle>
            <CardDescription className="text-xs">Growth across Government and CSR programs</CardDescription>
          </CardHeader>
          <CardContent>
            <ScholarshipChart data={yearlyApplicationStats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Top Scholarship Foundations</CardTitle>
            <CardDescription className="text-xs">Major public & CSR contributors to student education grants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProviders.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="text-xs font-bold text-primary bg-primary/10">
                      {provider.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">Verified Grant Provider</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-sm text-foreground">{provider.amount}</span>
                  <p className="text-[10px] text-muted-foreground">Annual Pool</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ScholarshipDetail
        scholarship={selectedScholarship}
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
