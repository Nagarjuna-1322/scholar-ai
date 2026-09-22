"use client";

import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScholarshipChart } from "@/components/ScholarshipChart";
import { Scholarship, yearlyApplicationStats, topProviders } from "@/lib/data";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { useProfile, UserProfile } from "@/contexts/ProfileContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useToast } from "@/hooks/use-toast";
import { daysUntil, cn } from "@/lib/utils";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import { StatusBadge } from "@/components/ScholarshipStatusTracker";
import { SetReminderButton } from "@/components/SetReminderButton";
import Link from "next/link";
import {
  Send,
  CalendarCheck,
  Trophy,
  ArrowRight,
  History as HistoryIcon,
  ExternalLink,
  Eye,
  Building2,
  Landmark,
  Search,
  Calendar,
  Clock,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Flame,
  Globe,
  UserCheck,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

type ScoredScholarship = Scholarship & { score: number };

function computeRecommendations(user: UserProfile, list: Scholarship[]): ScoredScholarship[] {
  return list
    .map((s) => {
      let score = 0;
      const userCourseLower = (user.course || "").toLowerCase();
      const matchesCourse = s.eligible_courses.some((c) =>
        userCourseLower.includes(c.toLowerCase()) || c.toLowerCase().includes(userCourseLower)
      );
      if (matchesCourse) score += 5;

      if (user.income <= s.income_limit) score += 4;
      if (user.marks_percent >= 80 && s.tags.includes("merit")) score += 3;
      if (s.tags.includes("stem") && (userCourseLower.includes("bachelor") || userCourseLower.includes("tech") || userCourseLower.includes("science"))) {
        score += 3;
      }
      if (s.tags.includes("women") && (user.course || "").length > 0) {
        score += 2;
      }
      return { ...s, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score > 0);
}

export default function DashboardPage() {
  const { applications, setStatus, getStatus } = useApplicationTracker();
  const { profile, setProfileOpen } = useProfile();
  const { scholarships, expiredArchive, stats: scholarshipStats, setUpdateModalOpen } = useScholarships();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("deadline");
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  // Application pipeline stats
  const appStats = {
    applied: Object.values(applications).filter((a) => a.status === "Applied").length,
    interviewing: Object.values(applications).filter((a) => a.status === "Interviewing").length,
    awarded: Object.values(applications).filter((a) => a.status === "Awarded").length,
    total: Object.keys(applications).length,
  };

  const govtCount = scholarshipStats.govtCount;
  const privateCount = scholarshipStats.privateCount;

  // Recommendations based on user profile
  const recommendedScholarships = useMemo(() => {
    return computeRecommendations(profile, scholarships).slice(0, 4);
  }, [profile, scholarships]);

  // Filtered and sorted scholarships for directory
  const filteredScholarships = useMemo(() => {
    return scholarships
      .filter((s) => {
        // Category filter
        if (selectedCategory === "new" && !s.isNew) return false;
        if (selectedCategory === "government" && s.category !== "Government") return false;
        if (selectedCategory === "private" && s.category !== "Private") return false;
        if (selectedCategory === "stem" && !s.tags.includes("stem")) return false;
        if (selectedCategory === "women" && !s.tags.includes("women")) return false;
        if (selectedCategory === "merit" && !s.tags.includes("merit")) return false;
        if (selectedCategory === "welfare" && !s.tags.includes("welfare")) return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(query) ||
          s.provider.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.amount.toLowerCase().includes(query) ||
          s.tags.some((t) => t.toLowerCase().includes(query)) ||
          s.eligible_courses.some((c) => c.toLowerCase().includes(query)) ||
          (s.source_portal && s.source_portal.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "provider") {
          return a.provider.localeCompare(b.provider);
        }
        if (sortBy === "amount") {
          // crude sort based on amount string length / digits
          const numA = parseInt(a.amount.replace(/[^0-9]/g, "") || "0", 10);
          const numB = parseInt(b.amount.replace(/[^0-9]/g, "") || "0", 10);
          return numB - numA;
        }
        return 0;
      });
  }, [scholarships, searchQuery, selectedCategory, sortBy]);

  const handleApplyRedirect = (scholarship: Scholarship) => {
    const currentStatus = getStatus(scholarship.id);
    if (!currentStatus) {
      setStatus(scholarship.id, "Applied", scholarship.title);
    }
    toast({
      title: `Redirecting to ${scholarship.provider}`,
      description: `Opening official portal in a new tab. Status marked as 'Applied' in your tracker!`,
    });
  };

  const handleOpenDetail = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30 text-xs px-2.5 py-0.5">
              🇮🇳 All-India Live Scholarships 2026–2027
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Live Verified Portals
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Indian Scholarships Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Live directory of Central/State Government schemes and verified Corporate/CSR scholarships with real-time deadlines and direct official portal application links.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)} className="gap-1.5">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>Profile ({profile.course})</span>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/history">
              <HistoryIcon className="h-4 w-4 text-primary" />
              <span>Application Pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/40">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Govt of India Schemes
            </CardTitle>
            <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{govtCount} Active</div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">NSP, AICTE, DST, UGC, States</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/60 dark:border-blue-800/40">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              Private & Corporate
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{privateCount} Active</div>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-400">Reliance, Tata, HDFC, Google, Amazon</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/60 dark:border-amber-800/40">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Total Live Grants
            </CardTitle>
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{scholarships.length} Programs</div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400">Updated deadlines for 2026–2027</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/60 dark:border-purple-800/40">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-800 dark:text-purple-300">
              Your Applications
            </CardTitle>
            <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{appStats.total} Tracked</div>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-400">
              {appStats.applied} Applied • {appStats.awarded} Awarded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: ⭐ RECOMMENDED FOR YOU (Directly on Dashboard) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Recommended For Your Profile</h2>
              <p className="text-xs text-muted-foreground">
                Matches for <span className="font-semibold text-foreground">{profile.course}</span> (Annual Income: ₹{profile.income.toLocaleString()}, Marks: {profile.marks_percent}%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setProfileOpen(true)} className="text-xs text-primary h-8">
              Update Profile Details
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs h-8 gap-1">
              <Link href="/recommendations">
                <span>View Full Recommendation Engine</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {recommendedScholarships.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No exact profile matches found based on your current inputs.</p>
            <Button variant="link" size="sm" onClick={() => setProfileOpen(true)}>
              Edit profile criteria (course, marks, income) to unlock tailored recommendations
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedScholarships.map((s) => {
              const status = getStatus(s.id);
              const daysLeft = daysUntil(s.deadline);
              let portalDomain = "";
              try {
                portalDomain = new URL(s.apply_link).hostname.replace(/^www\./, "");
              } catch {
                portalDomain = s.provider;
              }

              return (
                <Card
                  key={`rec-${s.id}`}
                  className={cn(
                    "flex flex-col justify-between hover:shadow-md transition-all border-primary/20 bg-card hover:border-primary/50 relative overflow-hidden",
                    daysLeft <= 3 && daysLeft >= 0 && "border-red-500/50 shadow-sm shadow-red-500/10 dark:border-red-600/50",
                    daysLeft > 3 && daysLeft <= 7 && "border-amber-500/50 shadow-sm shadow-amber-500/10 dark:border-amber-600/50"
                  )}
                >
                  <div className="absolute top-0 right-0 flex items-center gap-1.5 p-2 z-10">
                    {daysLeft <= 7 && daysLeft >= 0 && (
                      <DeadlineIndicator deadline={s.deadline} variant="badge" />
                    )}
                    <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] px-2 py-0.5 shadow-sm">
                      ★ Top Match ({s.score} pts)
                    </Badge>
                  </div>

                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap pr-16">
                      <Badge
                        variant={s.category === "Government" ? "default" : "secondary"}
                        className={
                          s.category === "Government"
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 text-[10px]"
                            : "bg-blue-600 text-white hover:bg-blue-700 text-[10px]"
                        }
                      >
                        {s.category === "Government" ? "🏛️ Govt" : "🏢 Private"}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[110px]">
                        {portalDomain}
                      </span>
                    </div>

                    <CardTitle className="text-base font-bold line-clamp-2 leading-snug">
                      {s.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-1">{s.provider}</p>

                    <div className="pt-1">
                      <Badge variant="outline" className="font-semibold text-primary border-primary/40 bg-primary/5 text-xs">
                        {s.amount}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3">
                    <div className="pt-1 border-t">
                      <DeadlineIndicator deadline={s.deadline} variant="compact" />
                    </div>

                    {status && (
                      <div className="pt-1">
                        <StatusBadge status={status} />
                      </div>
                    )}

                    <div className="pt-2 border-t grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(s)}
                        className="text-xs h-8 px-2"
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> Details
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="w-full text-xs h-8 px-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1"
                      >
                        <a
                          href={s.apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleApplyRedirect(s)}
                        >
                          <span>Apply</span>
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

      {/* SECTION 2: 🏛️ / 🏢 COMPLETE ALL-INDIA SCHOLARSHIPS DIRECTORY */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Complete All-India Scholarships Directory</h2>
            <p className="text-xs text-muted-foreground">
              Showing {filteredScholarships.length} of {scholarships.length} live government and private scholarships
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUpdateModalOpen(true)}
            className="gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 self-start md:self-auto"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span>Lifecycle Center ({scholarshipStats.newlyPublishedCount} New)</span>
          </Button>
        </div>

        {/* Dynamic Lifecycle & Replacements Banner */}
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/80 via-background to-indigo-50/50 dark:from-emerald-950/20 dark:to-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                Live Scholarship Updates Active:
              </span>{" "}
              <span className="text-muted-foreground">
                Expired scholarships are automatically removed and replaced with active 2026–2027 application cycles.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={selectedCategory === "new" ? "default" : "outline"}
              onClick={() => setSelectedCategory(selectedCategory === "new" ? "all" : "new")}
              className={`h-7 text-xs ${
                selectedCategory === "new"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              {selectedCategory === "new" ? "Show All Schemes" : `Filter New (${scholarshipStats.newlyPublishedCount})`}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setUpdateModalOpen(true)}
              className="h-7 text-xs text-primary"
            >
              View Audit & Archive ({expiredArchive.length})
            </Button>
          </div>
        </div>

        {/* Search, Filter Pills & Sort Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-muted/40 p-3 rounded-xl border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by scholarship title, provider (NSP, AICTE, Reliance, Tata...), course, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[175px] bg-background h-9 text-xs">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories ({scholarships.length})</SelectItem>
                <SelectItem value="new">✨ Newly Published ({scholarshipStats.newlyPublishedCount})</SelectItem>
                <SelectItem value="government">🏛️ Government ({govtCount})</SelectItem>
                <SelectItem value="private">🏢 Private / CSR ({privateCount})</SelectItem>
                <SelectItem value="stem">⚡ STEM & Tech</SelectItem>
                <SelectItem value="women">👩 Women in Tech</SelectItem>
                <SelectItem value="merit">🎓 Merit-Based</SelectItem>
                <SelectItem value="welfare">🤝 Need / Welfare</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] bg-background h-9 text-xs">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Earliest Deadline</SelectItem>
                <SelectItem value="amount">Highest Grant</SelectItem>
                <SelectItem value="title">Scholarship Name (A-Z)</SelectItem>
                <SelectItem value="provider">Provider (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || selectedCategory !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs h-9"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Scholarship Cards Grid */}
        {filteredScholarships.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <h3 className="text-base font-semibold">No scholarships match your filters</h3>
            <p className="text-xs text-muted-foreground">Try clearing search terms or changing category selection.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredScholarships.map((s) => {
              const status = getStatus(s.id);
              const daysLeft = daysUntil(s.deadline);
              let portalDomain = "";
              try {
                portalDomain = new URL(s.apply_link).hostname.replace(/^www\./, "");
              } catch {
                portalDomain = s.provider;
              }

              const isGovt = s.category === "Government";

              return (
                <Card
                  key={s.id}
                  className={cn(
                    "flex flex-col justify-between hover:shadow-lg transition-all border-border hover:border-primary/50 group bg-card",
                    daysLeft <= 3 && daysLeft >= 0 && "border-red-500/50 dark:border-red-600/50 shadow-sm shadow-red-500/10",
                    daysLeft > 3 && daysLeft <= 7 && "border-amber-500/50 dark:border-amber-600/50 shadow-sm shadow-amber-500/10"
                  )}
                >
                  <CardHeader className="p-5 pb-3 space-y-2.5">
                    {/* Top Row: Category + Domain + Deadline Urgency Badge + Set Reminder */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={isGovt ? "default" : "secondary"}
                          className={
                            isGovt
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-medium"
                              : "bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-medium"
                          }
                        >
                          {isGovt ? "🏛️ Govt of India" : "🏢 Private / CSR"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono bg-muted/30">
                          {portalDomain}
                        </Badge>
                        {daysLeft <= 7 && daysLeft >= 0 && (
                          <DeadlineIndicator deadline={s.deadline} variant="badge" />
                        )}
                      </div>
                      <SetReminderButton scholarship={s} size="sm" variant="ghost" />
                    </div>

                    {/* Title and Provider */}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {s.isNew && (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-semibold gap-1 animate-pulse shadow-xs">
                            <Sparkles className="h-2.5 w-2.5" />
                            NEW
                          </Badge>
                        )}
                        {s.replacesTitle && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30"
                            title={`Replaced expired scholarship: ${s.replacesTitle}`}
                          >
                            Replaces Expired
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {s.title}
                      </CardTitle>
                      <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
                        {isGovt ? <Landmark className="h-3.5 w-3.5 text-emerald-600" /> : <Building2 className="h-3.5 w-3.5 text-blue-600" />}
                        <span>{s.provider}</span>
                        {s.publishedAt && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Published {s.publishedAt}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Grant Amount & Level */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <Badge
                        variant="outline"
                        className="font-bold text-primary border-primary/40 bg-primary/5 text-xs py-0.5 px-2"
                      >
                        Grant: {s.amount}
                      </Badge>
                      {s.education_level && (
                        <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                          {s.education_level}
                        </span>
                      )}
                    </div>

                    <CardDescription className="text-xs line-clamp-3 leading-relaxed">
                      {s.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Eligibility criteria badges */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg">
                      <span>Max Family Income:</span>
                      <span className="font-semibold text-foreground">
                        ₹{s.income_limit.toLocaleString()} / yr
                      </span>
                    </div>

                    {/* Dynamic Color-Coded Deadline & Urgency Progress Bar */}
                    <DeadlineIndicator deadline={s.deadline} variant="detailed" />

                    {status && (
                      <div className="pt-1">
                        <StatusBadge status={status} />
                      </div>
                    )}

                    {/* Actions: View Details & Apply on Official Portal */}
                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(s)}
                        className="gap-1.5 text-xs h-9 px-3"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details & AI</span>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        className="flex-1 gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
                      >
                        <a
                          href={s.apply_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleApplyRedirect(s)}
                        >
                          <span>Apply on Official Portal</span>
                          <ExternalLink className="h-3.5 w-3.5" />
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

      {/* SECTION 3: HELPFUL VERIFIED OFFICIAL INDIAN PORTALS */}
      <div className="space-y-3 pt-6 border-t">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Key Official Portals for Indian Students</h2>
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
            <p className="text-xs text-muted-foreground">scholarships.gov.in • Central & State schemes</p>
          </a>

          <a
            href="https://www.aicte-india.org/schemes/students-development-schemes"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 border rounded-xl bg-card hover:border-primary transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm group-hover:text-primary">AICTE Schemes Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">aicte-india.org • Pragati, Saksham, Swanath</p>
          </a>

          <a
            href="https://www.reliancefoundation.org/scholarships"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 border rounded-xl bg-card hover:border-primary transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm group-hover:text-primary">Reliance Foundation</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">reliancefoundation.org • 5,000+ UG/PG grants</p>
          </a>

          <a
            href="https://www.buddy4study.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 border rounded-xl bg-card hover:border-primary transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm group-hover:text-primary">Buddy4Study CSR Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">buddy4study.com • Tata, HDFC, Kotak, Birla</p>
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
            <CardDescription className="text-xs">Highest financial contributors to student education grants</CardDescription>
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
                    <p className="text-xs text-muted-foreground">National Grant Contributor</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-foreground">{provider.amount}</span>
                  <p className="text-[10px] text-muted-foreground">Awarded pool</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Scholarship Detail Modal */}
      <ScholarshipDetail
        scholarship={selectedScholarship}
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
