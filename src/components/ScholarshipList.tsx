"use client";

import type { Scholarship } from "@/lib/data";
import { daysUntil, cn } from "@/lib/utils";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";
import { evaluateScholarshipEligibility } from "@/lib/eligibilityEngine";
import { useProfile } from "@/contexts/ProfileContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  ExternalLink,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bookmark,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { ScholarshipStatusTracker, StatusBadge } from "@/components/ScholarshipStatusTracker";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { useToast } from "@/hooks/use-toast";

export function ScholarshipList({
  scholarships = [],
  onSelectScholarship,
  onGenerateSummary,
}: {
  scholarships?: Scholarship[];
  onSelectScholarship: (scholarship: Scholarship) => void;
  onGenerateSummary?: (scholarship: Scholarship) => void;
}) {
  const safeScholarships = Array.isArray(scholarships) ? scholarships : [];
  const { profile } = useProfile();
  const { savedIds, toggleSavedScholarship, comparisonIds, toggleCompareScholarship } = useScholarships();
  const { getStatus, setStatus } = useApplicationTracker();
  const { toast } = useToast();

  if (safeScholarships.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-lg border">
        <p className="text-lg font-semibold">No scholarships found</p>
        <p className="text-muted-foreground mt-1">Try adjusting your search query or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {safeScholarships.map((s) => {
        const status = getStatus(s.id);
        const daysLeft = daysUntil(s.deadline);
        const evaluation = evaluateScholarshipEligibility(profile, s);
        const isSaved = savedIds.includes(String(s.id));
        const isCompared = comparisonIds.includes(String(s.id));

        return (
          <Card
            key={s.id}
            className={cn(
              "hover:shadow-md transition-all",
              daysLeft <= 3 && daysLeft >= 0 && "border-red-500/50 dark:border-red-600/50",
              daysLeft > 3 && daysLeft <= 7 && "border-amber-500/50 dark:border-amber-600/50"
            )}
          >
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="font-headline text-lg">{s.title}</CardTitle>
                    {evaluation.status === "Eligible" ? (
                      <Badge className="bg-emerald-600 text-white text-[11px] gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Eligible ({evaluation.compatibilityScore}%)
                      </Badge>
                    ) : evaluation.status === "Possibly Eligible" ? (
                      <Badge className="bg-amber-600 text-white text-[11px] gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Possibly Eligible ({evaluation.compatibilityScore}%)
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[11px] gap-1">
                        <XCircle className="h-3 w-3" />
                        Not Eligible
                      </Badge>
                    )}
                    <Badge variant="outline" className="font-mono text-xs font-semibold text-primary">
                      ₹{s.amount.toLocaleString("en-IN")}/yr
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      {s.verification_status || "Verified Source"}
                    </Badge>
                    {status && <StatusBadge status={status} />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <CardDescription className="inline font-medium text-foreground">
                      {s.provider}
                    </CardDescription>
                    <span>•</span>
                    <span>Region: {s.region}</span>
                    <span>•</span>
                    <span>Last Verified: {s.last_verified_at || "2026-02-15"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <Button
                    size="sm"
                    variant={isSaved ? "secondary" : "outline"}
                    onClick={() => toggleSavedScholarship(s.id)}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current text-primary")} />
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={isCompared ? "secondary" : "outline"}
                    onClick={() => toggleCompareScholarship(s.id)}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <Scale className="h-3.5 w-3.5 text-indigo-600" />
                    <span>{isCompared ? "Comparing" : "Compare"}</span>
                  </Button>
                  {onGenerateSummary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerateSummary(s)}
                      className="h-8 px-2.5 gap-1 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Summary PDF</span>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onSelectScholarship(s)} className="h-8 px-2.5 text-xs">
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Eligibility & Guide
                  </Button>
                  <Button asChild size="sm" className="h-8 px-2.5 gap-1 text-xs font-medium">
                    <a
                      href={s.apply_link || s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (!status || status === "Saved" || status === "Preparing Documents" || status === "Ready to Apply") {
                          setStatus(s.id, "Application Started", s.title);
                        }
                        toast({
                          title: `Opened ${s.provider} Official Portal`,
                          description: `Marked as 'Application Started'. Confirm submission in your tracker after applying.`,
                        });
                      }}
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{evaluation.summaryReason}</p>
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Quick Stage Selector:</span>
                <ScholarshipStatusTracker
                  scholarshipId={s.id}
                  scholarshipTitle={s.title}
                  variant="badge-selector"
                  size="sm"
                  showUpdatedDate={false}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-sm pt-0">
              <div className="flex flex-wrap gap-1.5">
                {s.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="shrink-0 ml-4">
                <DeadlineIndicator deadline={s.deadline} variant="compact" />
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
