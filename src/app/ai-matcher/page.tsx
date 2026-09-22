"use client";

import { useState, useTransition, useMemo } from "react";
import { sampleScholarships, type Scholarship } from "@/lib/data";
import { searchScholarshipsAction } from "@/app/actions";
import { ScholarshipList } from "@/components/ScholarshipList";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import { ApplicationSummaryModal } from "@/components/ApplicationSummaryModal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AIMatcher } from "@/components/AIMatcher";
import { useProfile, UserProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Sparkles,
  User,
  GraduationCap,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  ExternalLink,
} from "lucide-react";
import { daysUntil } from "@/lib/utils";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";

function scoreScholarshipForUser(user: UserProfile, s: Scholarship): number {
  let score = 0;
  const userCourseLower = (user.course || "").toLowerCase();
  const matchesCourse = s.eligible_courses.some(
    (c) => userCourseLower.includes(c.toLowerCase()) || c.toLowerCase().includes(userCourseLower)
  );
  if (matchesCourse) score += 5;
  if (user.income <= s.income_limit) score += 4;
  if (user.marks_percent >= 80 && s.tags.includes("merit")) score += 3;
  if (s.tags.includes("stem") && (userCourseLower.includes("tech") || userCourseLower.includes("engineer") || userCourseLower.includes("bachelor"))) {
    score += 3;
  }
  return score;
}

export default function AIMatcherPage() {
  const { toast } = useToast();
  const { profile, setProfileOpen } = useProfile();

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  // Detail Modal State
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  // PDF Summary Modal State
  const [summaryScholarship, setSummaryScholarship] = useState<Scholarship | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Quick picker state
  const [quickSelectedId, setQuickSelectedId] = useState<string>("");

  const handleSelectScholarship = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
  };

  const handleOpenSummary = (scholarship: Scholarship) => {
    setSummaryScholarship(scholarship);
    setIsSummaryModalOpen(true);
  };

  const handleSearch = (query: string) => {
    setHasSearched(true);
    startSearchTransition(async () => {
      try {
        const result = await searchScholarshipsAction(query, sampleScholarships);
        if (Array.isArray(result)) {
          setScholarships(result);
        } else {
          setScholarships([]);
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Search Error",
          description: "Failed to search scholarships. Please try again.",
        });
        setScholarships([]);
      }
    });
  };

  const handleClear = () => {
    setScholarships([]);
    setHasSearched(false);
  };

  // Top matches based on current user profile
  const profileMatches = useMemo(() => {
    return [...sampleScholarships]
      .map((s) => ({ ...s, score: scoreScholarshipForUser(profile, s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [profile]);

  const handleQuickSummaryGenerate = () => {
    const target = sampleScholarships.find((s) => s.id === quickSelectedId);
    if (target) {
      handleOpenSummary(target);
    } else if (profileMatches.length > 0) {
      handleOpenSummary(profileMatches[0]);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">AI Scholarship Matcher</h1>
            <Badge className="bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 text-xs font-semibold">
              PDF Records Active
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Use natural language to find scholarships, evaluate fit, and generate simplified Application Summary PDFs for your records.
          </p>
        </div>

        {/* User Profile Snapshot Badge */}
        <div className="flex items-center gap-2 bg-card border rounded-lg p-2.5 px-3 shadow-xs text-xs">
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="truncate max-w-[180px]">
            <p className="font-semibold text-foreground truncate">{profile.name || "Student Applicant"}</p>
            <p className="text-muted-foreground text-[11px] truncate">
              {profile.course || "General"} • ₹{(profile.income / 100000).toFixed(1)}L/yr
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProfileOpen(true)}
            className="text-[11px] h-7 px-2 text-primary hover:text-primary/90"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Feature Banner: Scholarship Application Summary PDF */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-card to-purple-50/30 dark:from-indigo-950/20 dark:via-card dark:to-purple-950/10 shadow-xs">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0 mt-0.5">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg font-bold text-foreground">
                    Scholarship Application Summary (PDF Record Dossier)
                  </CardTitle>
                  <Badge variant="outline" className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 bg-white/60 dark:bg-black/20 text-[10px]">
                    Offline Tracking
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Generate an official, simplified 1-page PDF summary for your selected scholarship containing your student profile snapshot, eligibility check, scholarship metadata, and essential document verification checklist.
                </CardDescription>
              </div>
            </div>

            {/* Quick Generator Selector */}
            <div className="flex items-center gap-2 shrink-0 sm:self-center">
              <Select
                value={quickSelectedId}
                onValueChange={(val) => {
                  setQuickSelectedId(val);
                  const target = sampleScholarships.find((s) => s.id === val);
                  if (target) handleOpenSummary(target);
                }}
              >
                <SelectTrigger className="w-[220px] text-xs h-9 bg-background">
                  <SelectValue placeholder="Quick Generate PDF for..." />
                </SelectTrigger>
                <SelectContent>
                  {sampleScholarships.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.title.length > 28 ? `${s.title.slice(0, 28)}...` : s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={handleQuickSummaryGenerate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-3 gap-1.5 text-xs font-semibold shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Create PDF</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* AI Matcher Search Bar */}
      <div className="space-y-3">
        <AIMatcher isSearching={isSearching} onSearch={handleSearch} onClear={handleClear} />
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Try: &ldquo;scholarships for computer science students under 5 lakhs income&rdquo; or &ldquo;women engineering grants&rdquo;
          </span>
          {hasSearched && (
            <span className="font-medium text-foreground">
              {scholarships.length} {scholarships.length === 1 ? "result" : "results"} found
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isSearching ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/40 p-3 px-4 rounded-lg border text-xs">
            <span className="text-muted-foreground">
              Click <strong className="text-indigo-600 dark:text-indigo-400">Summary PDF</strong> on any card to export a tailored application dossier for your records.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs h-7 px-2"
            >
              Reset Search
            </Button>
          </div>

          <ScholarshipList
            scholarships={scholarships}
            onSelectScholarship={handleSelectScholarship}
            onGenerateSummary={handleOpenSummary}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile-Matched Scholarships Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Top Matched Scholarships for Your Profile
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pre-screened against your course ({profile.course}) and annual family income (₹{profile.income.toLocaleString("en-IN")}).
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {profileMatches.length} Matches Ready
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileMatches.map((s) => {
                const daysLeft = daysUntil(s.deadline);
                const isIncomeOk = profile.income <= s.income_limit;

                return (
                  <Card
                    key={s.id}
                    className="flex flex-col justify-between hover:shadow-md transition-all border bg-card hover:border-primary/40"
                  >
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={
                                s.category === "Government"
                                  ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20 text-[10px]"
                                  : "bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-600/20 text-[10px]"
                              }
                            >
                              {s.category === "Government" ? "🏛️ Govt" : "🏢 Private"}
                            </Badge>
                            {daysLeft <= 7 && daysLeft >= 0 && (
                              <DeadlineIndicator deadline={s.deadline} variant="badge" />
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                isIncomeOk
                                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                  : "border-amber-500/40 text-amber-600 bg-amber-500/10"
                              }`}
                            >
                              {isIncomeOk ? "✓ Income Fit" : "Income Review"}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm leading-snug text-foreground">{s.title}</h4>
                          <p className="text-xs text-muted-foreground">{s.provider}</p>
                        </div>

                        <Badge variant="outline" className="font-semibold text-primary border-primary/40 bg-primary/5 text-xs shrink-0">
                          {s.amount}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 pb-3 space-y-2">
                      <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline: <strong className="text-foreground">{s.deadline}</strong>
                        </span>
                        <span>{daysLeft} days left</span>
                      </div>
                    </CardContent>

                    <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectScholarship(s)}
                        className="text-xs h-8 px-2.5"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View Info
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenSummary(s)}
                        className="text-xs h-8 px-2.5 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Summary PDF</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Educational Note about Application Summary Records */}
          <div className="p-4 rounded-xl border bg-muted/20 flex items-start gap-3 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Why download the Scholarship Application Summary PDF?</p>
              <p>
                The summary PDF compiles your official profile data, verified eligibility criteria, funding details, and standard verification document checklist into a single-page document. Keep it in your personal folder for college office attestations, interview preparation, and application tracking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scholarship Full Details Drawer */}
      <ScholarshipDetail
        scholarship={selectedScholarship}
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Scholarship Application Summary PDF Modal */}
      <ApplicationSummaryModal
        scholarship={summaryScholarship}
        isOpen={isSummaryModalOpen}
        onOpenChange={setIsSummaryModalOpen}
      />
    </div>
  );
}
