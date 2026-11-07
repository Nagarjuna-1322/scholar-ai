"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import type { Scholarship } from "@/lib/data";
import { verifyScholarshipSourceDomain } from "@/lib/data";
import { evaluateScholarshipEligibility } from "@/lib/eligibilityEngine";
import { useProfile } from "@/contexts/ProfileContext";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useToast } from "@/hooks/use-toast";
import { daysUntil } from "@/lib/utils";
import { explainRecommendationAction, generateEssayAction } from "@/app/actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Bot,
  Loader2,
  ExternalLink,
  Globe,
  FileText,
  Download,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Flag,
  CheckSquare,
  Square,
  ListChecks,
  Send,
} from "lucide-react";
import { ScholarshipStatusTracker } from "@/components/ScholarshipStatusTracker";
import { SetReminderButton } from "@/components/SetReminderButton";
import { ApplicationSummaryModal } from "@/components/ApplicationSummaryModal";

export function ScholarshipDetail({
  scholarship,
  isOpen,
  onOpenChange,
}: {
  scholarship: Scholarship | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const tracker = useApplicationTracker();
  const { submitListingReport } = useScholarships();

  const [explanation, setExplanation] = useState("");
  const [essay, setEssay] = useState("");
  const [essayGoals, setEssayGoals] = useState("");
  const [essayReview, setEssayReview] = useState("");
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Post-portal navigation confirmation state (Never auto-mark as Submitted!)
  const [showPortalConfirmBanner, setShowPortalConfirmBanner] = useState(false);
  const [confirmRefId, setConfirmRefId] = useState("");
  const [confirmDate, setConfirmDate] = useState("2026-11-07");

  // Fraud / Inaccuracy Reporting state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<"Incorrect Deadline" | "Broken Link" | "Suspicious / Fee Request" | "Outdated Criteria">("Incorrect Deadline");
  const [reportDetails, setReportDetails] = useState("");

  const [isExplanationLoading, startExplanationTransition] = useTransition();
  const [isEssayLoading, startEssayTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setExplanation("");
      setEssay("");
      setEssayReview("");
      setShowPortalConfirmBanner(false);
      setShowReportForm(false);
    }
  }, [isOpen, scholarship?.id]);

  const evaluation = useMemo(() => {
    if (!scholarship) return null;
    return evaluateScholarshipEligibility(profile, scholarship);
  }, [profile, scholarship]);

  const domainCheck = useMemo(() => {
    if (!scholarship) return { isHttps: false, isTrustedGovOrCSR: false, hostname: "" };
    return verifyScholarshipSourceDomain(scholarship.apply_link || scholarship.link);
  }, [scholarship]);

  if (!scholarship || !evaluation) return null;

  const daysLeft = daysUntil(scholarship.deadline);
  const record = tracker.getRecord(scholarship.id);
  const completedDocs = new Set([
    ...(profile.completed_documents || []),
    ...(record?.completedDocuments || []),
  ]);

  const handleToggleDocument = (docName: string) => {
    tracker.toggleCompletedDocument(scholarship.id, docName, scholarship.title);
    const currentProfileDocs = profile.completed_documents || [];
    const exists = currentProfileDocs.includes(docName);
    const updatedProfileDocs = exists
      ? currentProfileDocs.filter((d) => d !== docName)
      : [...currentProfileDocs, docName];
    updateProfile({ completed_documents: updatedProfileDocs });
  };

  const handleExplain = () => {
    setExplanation("");
    startExplanationTransition(async () => {
      const result = await explainRecommendationAction(scholarship, profile);
      setExplanation(result);
    });
  };

  const handleGenerateEssay = () => {
    setEssay("");
    setEssayReview("");
    startEssayTransition(async () => {
      const prompt =
        essayGoals.trim() ||
        `Academic background in ${profile.course} (${profile.marks_percent}%) and how this scholarship supports my tuition and educational goals.`;
      const result = await generateEssayAction(scholarship, profile, prompt);
      setEssay(result);
    });
  };

  const handleReviewEssay = async () => {
    if (!essay.trim()) return;
    setIsReviewLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review_essay",
          essayText: essay,
          scholarshipTitle: scholarship.title,
        }),
      });
      const data = await res.json();
      if (data.review) {
        setEssayReview(data.review);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Review Error",
        description: "Could not complete essay review right now.",
      });
    } finally {
      setIsReviewLoading(false);
    }
  };

  // CRITICAL RULE: Clicking an external Apply button MUST NOT automatically mark an application as Submitted.
  const handleVisitPortal = () => {
    const currentStatus = tracker.getStatus(scholarship.id);
    if (!currentStatus || currentStatus === "Saved" || currentStatus === "Preparing Documents" || currentStatus === "Ready to Apply") {
      tracker.setStatus(scholarship.id, "Application Started", scholarship.title);
    }
    setShowPortalConfirmBanner(true);
    toast({
      title: `Opened ${scholarship.provider} Portal`,
      description: `Marked as "Application Started". Once you finish submitting on the official site, click "Confirm Submitted" to log your Application ID.`,
    });
  };

  const handleConfirmSubmission = () => {
    tracker.setStatus(scholarship.id, "Submitted", scholarship.title, {
      applicationReferenceId: confirmRefId.trim() || undefined,
      submissionDate: confirmDate || new Date().toISOString(),
    });
    setShowPortalConfirmBanner(false);
    toast({
      title: "Application Marked as Submitted",
      description: confirmRefId.trim()
        ? `Recorded official submission (Ref ID: ${confirmRefId.trim()}). Deadline reminders paused.`
        : "Recorded self-reported submission. Deadline reminders paused.",
    });
  };

  const handleSubmitReport = () => {
    if (!reportDetails.trim()) {
      toast({
        variant: "destructive",
        title: "Details Required",
        description: "Please briefly describe the issue with this scholarship listing.",
      });
      return;
    }
    submitListingReport({
      scholarshipId: scholarship.id,
      scholarshipTitle: scholarship.title,
      reporterEmail: profile.email || "student@scholarai.in",
      reason: reportReason,
      details: reportDetails.trim(),
    });
    setReportDetails("");
    setShowReportForm(false);
    toast({
      title: "Feedback Submitted",
      description: "Thank you for helping keep ScholarAI listings verified and scam-free.",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-3 border-b bg-card">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={scholarship.category === "Government" ? "default" : "secondary"}
                className={
                  scholarship.category === "Government"
                    ? "bg-emerald-700 text-white"
                    : "bg-indigo-700 text-white"
                }
              >
                {scholarship.category === "Government" ? "Govt / Public Portal" : "Corporate CSR / Foundation"}
              </Badge>
              <Badge variant="outline" className="font-mono font-semibold text-primary border-primary/40 bg-primary/5">
                ₹{scholarship.amount.toLocaleString("en-IN")}/yr
              </Badge>
              <Badge
                variant="outline"
                className={
                  scholarship.verification_status === "Verified Source"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : scholarship.verification_status === "Information Outdated"
                    ? "bg-rose-50 text-rose-700 border-rose-300"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                }
              >
                <ShieldCheck className="h-3 w-3 mr-1" />
                {scholarship.verification_status || "Verified Source"}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Last Verified: {scholarship.last_verified_at || "2026-02-15"}
            </span>
          </div>

          <SheetTitle className="text-xl sm:text-2xl font-headline">{scholarship.title}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{scholarship.provider}</span>
                <Badge variant={daysLeft <= 0 ? "destructive" : daysLeft < 30 ? "destructive" : "secondary"}>
                  {daysLeft <= 0
                    ? `Closed (${scholarship.deadline})`
                    : `Deadline: ${scholarship.deadline} (${daysLeft} days left)`}
                </Badge>
              </div>
              <SetReminderButton scholarship={scholarship} size="sm" variant="outline" />
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto px-6 py-5 space-y-6">
          {/* Anti-Fraud Safety Notice */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900 dark:text-amber-200">
                <span className="font-semibold">Student Safety & Fraud Protection:</span>{" "}
                {scholarship.fee_warning ||
                  "Official government and CSR scholarship portals NEVER ask for an application fee, processing fee, or bank PIN."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReportForm((v) => !v)}
              className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:underline shrink-0 flex items-center gap-1"
            >
              <Flag className="h-3 w-3" />
              Report Issue
            </button>
          </div>

          {showReportForm && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Report Inaccurate or Suspicious Scholarship Listing
                </h5>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "Incorrect Deadline",
                    "Broken Link",
                    "Suspicious / Fee Request",
                    "Outdated Criteria",
                  ] as const
                ).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReportReason(reason)}
                    className={`p-2 rounded border text-xs text-left font-medium ${
                      reportReason === reason
                        ? "border-rose-600 bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe what is inaccurate or suspicious (e.g., official portal shows deadline extended, or link redirects elsewhere)..."
                rows={2}
                className="text-xs"
              />
              <Button size="sm" variant="destructive" onClick={handleSubmitReport} className="text-xs">
                Submit Feedback
              </Button>
            </div>
          )}

          {/* Post-Redirect Confirmation Banner */}
          {showPortalConfirmBanner && (
            <div className="p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Send className="h-4 w-4 text-indigo-600" />
                    Did you finish submitting on {scholarship.provider}?
                  </h4>
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-0.5">
                    We marked this as <strong>Application Started</strong>. Only confirm below if you completed the official portal submission.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={confirmRefId}
                  onChange={(e) => setConfirmRefId(e.target.value)}
                  placeholder="Optional Official Application / NSP ID"
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
                <Input
                  type="date"
                  value={confirmDate}
                  onChange={(e) => setConfirmDate(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleConfirmSubmission} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                  Confirm Application Submitted
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPortalConfirmBanner(false)}
                  className="h-8 text-xs"
                >
                  I&apos;m Still Preparing / Apply Later
                </Button>
              </div>
            </div>
          )}

          {/* Deterministic Eligibility Evaluation Card */}
          <div className="p-4 rounded-xl border bg-slate-50/80 dark:bg-slate-900/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {evaluation.status === "Eligible" ? (
                  <Badge className="bg-emerald-600 text-white">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Eligible
                  </Badge>
                ) : evaluation.status === "Possibly Eligible" ? (
                  <Badge className="bg-amber-600 text-white">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Possibly Eligible
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Not Eligible
                  </Badge>
                )}
                <span className="text-xs font-mono font-semibold text-foreground">
                  {evaluation.compatibilityScore}% Profile Compatibility Score
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Deterministic Rule Check (Not an award guarantee)
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{evaluation.summaryReason}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Matched Criteria ({evaluation.matchedCriteria.length})
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {evaluation.matchedCriteria.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {(evaluation.unmetCriteria.length > 0 || evaluation.missingInformation.length > 0) && (
                <div className="space-y-1">
                  <p className="font-semibold text-rose-700 dark:text-rose-400">
                    Unmet / Missing Details
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    {evaluation.unmetCriteria.map((item, idx) => (
                      <li key={`u-${idx}`} className="flex items-start gap-1.5 text-rose-700 dark:text-rose-300">
                        <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {evaluation.missingInformation.map((item, idx) => (
                      <li key={`m-${idx}`} className="flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Official Source Portal Card */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Verified Official Application Source</span>
                </div>
                <h4 className="font-bold text-foreground text-base">{scholarship.provider}</h4>
                <p className="text-xs text-muted-foreground">
                  {scholarship.selection_process ||
                    "Applications are submitted directly on the official portal. Keep your application reference number after submitting."}
                </p>
              </div>
              <Badge variant="outline" className="text-[11px] bg-background text-primary border-primary/30 shrink-0">
                {domainCheck.isHttps ? "HTTPS Verified" : "External Link"}
              </Badge>
            </div>

            <div className="pt-2 border-t border-primary/10 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground font-mono truncate max-w-[280px]">
                {domainCheck.hostname || scholarship.provider}
              </div>
              <a
                href={scholarship.apply_link || scholarship.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleVisitPortal}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <span>Open Official Portal (Marks &lsquo;Application Started&rsquo;)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Official Requirements & Combinability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3.5 rounded-lg border space-y-1.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Official Eligibility Rules
              </h4>
              <p className="text-xs text-foreground leading-relaxed">
                {scholarship.eligibility.description}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 pt-1">
                <li>• Minimum Marks: {scholarship.eligibility.minMarks ?? 60}%</li>
                <li>• Income Limit: ₹{scholarship.income_limit.toLocaleString("en-IN")}/yr</li>
                <li>• Domicile / Region: {scholarship.region}</li>
                <li>• Categories: {scholarship.eligible_categories.join(", ")}</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg border space-y-1.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Step-by-Step Application Process
              </h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                {(
                  scholarship.application_steps || [
                    "Register on the official scholarship portal.",
                    "Complete academic, domicile, and bank DBT details.",
                    "Upload scanned PDF/JPEG certificates under 5MB.",
                    "Submit and save the official Application Reference ID.",
                  ]
                ).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {scholarship.combinable_rules && (
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 pt-1 font-medium">
                  Note: {scholarship.combinable_rules}
                </p>
              )}
            </div>
          </div>

          {/* Interactive Required Document Checklist */}
          <div className="p-4 rounded-xl border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                Required Document Checklist
              </h4>
              <span className="text-xs text-muted-foreground">
                Click to mark documents you have ready
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                scholarship.required_documents || [
                  "Previous Academic Mark Sheet",
                  "Valid Family Income Certificate",
                  "Bonafide / Admission Certificate",
                  "Category / Domicile Certificate",
                  "Student Bank Passbook Copy",
                ]
              ).map((doc) => {
                const isDone = completedDocs.has(doc);
                return (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => handleToggleDocument(doc)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-colors ${
                      isDone
                        ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "border-border hover:bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate font-medium">{doc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 10-Stage Application Status Tracker */}
          <ScholarshipStatusTracker
            scholarshipId={scholarship.id}
            scholarshipTitle={scholarship.title}
          />

          <Separator />

          {/* Grounded AI Application Assistant */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <Sparkles className="text-primary h-4 w-4" /> AI Application & Essay Assistant (Grounded in Your Profile)
            </h4>

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">AI Eligibility Explanation</p>
                  <p className="text-xs text-muted-foreground">
                    Explains your deterministic match alongside official requirements
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleExplain} disabled={isExplanationLoading}>
                  {isExplanationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Explain Match
                </Button>
              </div>
              {isExplanationLoading && <Skeleton className="h-14 mt-2" />}
              {explanation && (
                <div className="mt-2 text-xs text-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-md flex gap-2 border">
                  <Bot className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <p className="leading-relaxed">{explanation}</p>
                </div>
              )}
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <p className="font-medium text-sm">Truthful Statement of Purpose / Essay Drafter</p>
                  <p className="text-xs text-muted-foreground">
                    Uses only your confirmed profile details — never fabricates achievements
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleGenerateEssay} disabled={isEssayLoading}>
                    {isEssayLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Draft Statement
                  </Button>
                  {essay && (
                    <Button size="sm" variant="secondary" onClick={handleReviewEssay} disabled={isReviewLoading}>
                      {isReviewLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                      Review & Improve
                    </Button>
                  )}
                </div>
              </div>

              <Input
                value={essayGoals}
                onChange={(e) => setEssayGoals(e.target.value)}
                placeholder="Optional: Add your specific career goal or confirmed project/achievement to include..."
                className="text-xs h-8"
              />

              {isEssayLoading && <Skeleton className="h-28 mt-2" />}
              {essay && (
                <Textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  rows={8}
                  className="text-xs leading-relaxed"
                />
              )}
              {essayReview && (
                <div className="p-3 rounded-lg border bg-indigo-50/50 dark:bg-indigo-950/30 text-xs space-y-1 whitespace-pre-wrap">
                  <p className="font-bold text-indigo-900 dark:text-indigo-200">AI Essay Feedback & Suggestions:</p>
                  <p className="text-muted-foreground">{essayReview}</p>
                </div>
              )}
            </div>

            <div className="p-4 border rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/40">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-1.5 text-sm">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Application Readiness Summary PDF
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Download your checklist, profile snapshot, and official portal details
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsSummaryModalOpen(true)}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Summary PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="p-4 sm:p-6 bg-card border-t mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <SetReminderButton scholarship={scholarship} size="sm" variant="outline" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              asChild
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm gap-2"
            >
              <a
                href={scholarship.apply_link || scholarship.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleVisitPortal}
              >
                <span>Open Official Portal</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </SheetFooter>

        <ApplicationSummaryModal
          scholarship={scholarship}
          isOpen={isSummaryModalOpen}
          onOpenChange={setIsSummaryModalOpen}
        />
      </SheetContent>
    </Sheet>
  );
}
