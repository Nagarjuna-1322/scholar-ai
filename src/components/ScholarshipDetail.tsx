"use client";

import { useState, useTransition, useEffect } from "react";
import type { Scholarship } from "@/lib/data";
import { useProfile } from "@/contexts/ProfileContext";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Bot,
  Loader2,
  ArrowRight,
  ExternalLink,
  Building2,
  Globe,
  FileText,
  Download,
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
  const { profile } = useProfile();
  const { toast } = useToast();
  const tracker = useApplicationTracker();
  const [explanation, setExplanation] = useState("");
  const [essay, setEssay] = useState("");
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isExplanationLoading, startExplanationTransition] = useTransition();
  const [isEssayLoading, startEssayTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setExplanation("");
      setEssay("");
    }
  }, [isOpen]);

  const handleExplain = () => {
    if (!scholarship) return;
    setExplanation("");
    startExplanationTransition(async () => {
      const result = await explainRecommendationAction(scholarship, profile);
      setExplanation(result);
    });
  };

  const handleGenerateEssay = () => {
    if (!scholarship) return;
    setEssay("");
    startEssayTransition(async () => {
      const prompt = `Write an essay for the ${scholarship.title}, highlighting my academic achievements and financial need.`;
      const result = await generateEssayAction(scholarship, profile, prompt);
      setEssay(result);
    });
  };

  const handleApplyRedirect = () => {
    if (!scholarship) return;
    const currentStatus = tracker.getStatus(scholarship.id);
    if (!currentStatus) {
      tracker.setStatus(scholarship.id, "Applied", scholarship.title);
    }
    toast({
      title: `Redirecting to ${scholarship.provider}`,
      description: `Opening the official application site in a new tab. Status updated to 'Applied'.`,
    });
  };

  if (!scholarship) return null;

  const daysLeft = daysUntil(scholarship.deadline);

  let portalDomain = "";
  try {
    portalDomain = new URL(scholarship.apply_link).hostname.replace(/^www\./, "");
  } catch {
    portalDomain = scholarship.provider;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-3 border-b bg-card">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              variant={scholarship.category === "Government" ? "default" : "secondary"}
              className={
                scholarship.category === "Government"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }
            >
              {scholarship.category === "Government" ? "🏛️ Govt of India" : "🏢 Private / CSR"}
            </Badge>
            {scholarship.amount && (
              <Badge variant="outline" className="font-semibold text-primary border-primary/40 bg-primary/5">
                Grant: {scholarship.amount}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-2xl font-headline">{scholarship.title}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{scholarship.provider}</span>
                <Badge variant={daysLeft < 30 ? "destructive" : "secondary"}>
                  Deadline: {scholarship.deadline} ({daysLeft} days left)
                </Badge>
              </div>
              <SetReminderButton scholarship={scholarship} size="sm" variant="outline" />
            </div>
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6">
          {/* Newly Published & Replaced Banners */}
          {scholarship.isNew && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-start gap-3 text-xs">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  ✨ Newly Published Scholarship Scheme
                </span>
                <p className="text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  This program is currently open for the 2026-27 academic session. Applications are actively being accepted on the official portal.
                  {scholarship.publishedAt && ` (Published: ${scholarship.publishedAt})`}
                </p>
              </div>
            </div>
          )}

          {scholarship.replacesTitle && (
            <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30 flex items-start gap-3 text-xs">
              <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-indigo-900 dark:text-indigo-200">
                  🔄 Active Cycle Replacement
                </span>
                <p className="text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                  This scheme replaced the expired application cycle for &ldquo;{scholarship.replacesTitle}&rdquo; so you have uninterrupted access to current funding.
                </p>
              </div>
            </div>
          )}

          {/* Direct Company Scholarship Portal Card */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Official Application Portal</span>
                </div>
                <h4 className="font-bold text-foreground text-base">
                  {scholarship.provider}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Apply directly on the company&apos;s verified scholarship portal. Students submit documents and track their progress on their host site.
                </p>
              </div>
              <Badge variant="outline" className="text-[11px] bg-background text-primary border-primary/30 shrink-0">
                Official Site
              </Badge>
            </div>

            <div className="pt-2 border-t border-primary/10 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground font-mono truncate max-w-[280px]">
                {portalDomain}
              </div>
              <a
                href={scholarship.apply_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleApplyRedirect}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <span>Visit Company Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-1.5 text-sm">About the Scholarship</h4>
            <p className="text-sm text-foreground/90 leading-relaxed">{scholarship.description}</p>
          </div>

          <div className="text-sm">
            <h4 className="font-semibold mb-2">Eligibility Requirements</h4>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Eligible Courses: {scholarship.eligible_courses.join(", ")}</li>
              <li>Max Family Income: ₹{scholarship.income_limit.toLocaleString()}</li>
              <li>Official registration and verification directly on {scholarship.provider}&apos;s portal.</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {scholarship.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Status Tracker */}
          <ScholarshipStatusTracker
            scholarshipId={scholarship.id}
            scholarshipTitle={scholarship.title}
          />

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="text-accent h-5 w-5" /> AI Tools
            </h4>

            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-medium">Why is this for me?</p>
                <Button size="sm" variant="outline" onClick={handleExplain} disabled={isExplanationLoading}>
                  {isExplanationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Explain
                </Button>
              </div>
              {isExplanationLoading && <Skeleton className="h-16 mt-2" />}
              {explanation && (
                <div className="mt-2 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 p-3 rounded-md flex gap-2">
                  <Bot className="h-4 w-4 shrink-0 mt-1" />
                  <p>{explanation}</p>
                </div>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">AI Essay Assistant</p>
                <Button size="sm" variant="outline" onClick={handleGenerateEssay} disabled={isEssayLoading}>
                  {isEssayLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Draft Essay
                </Button>
              </div>
              {isEssayLoading && <Skeleton className="h-24 mt-2" />}
              {essay && <Textarea value={essay} onChange={(e) => setEssay(e.target.value)} rows={8} className="text-sm" />}
            </div>

            <div className="p-4 border rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-900/40">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Application Summary PDF
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generate simplified PDF for your records & document verification
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsSummaryModalOpen(true)}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Generate PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="p-4 sm:p-6 bg-card border-t mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSummaryModalOpen(true)}
              className="gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Summary PDF</span>
            </Button>
            <SetReminderButton scholarship={scholarship} variant="outline" />
          </div>

          <Button asChild className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm gap-2">
            <a
              href={scholarship.apply_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleApplyRedirect}
            >
              <span>Apply on Official Portal</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
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
