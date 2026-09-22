"use client";

import type { Scholarship } from "@/lib/data";
import { daysUntil, cn } from "@/lib/utils";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";
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
import { Eye, ExternalLink, FileText } from "lucide-react";
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

        return (
          <Card
            key={s.id}
            className={cn(
              "hover:shadow-lg transition-all",
              daysLeft <= 3 && daysLeft >= 0 && "border-red-500/50 dark:border-red-600/50 shadow-sm shadow-red-500/10",
              daysLeft > 3 && daysLeft <= 7 && "border-amber-500/50 dark:border-amber-600/50 shadow-sm shadow-amber-500/10"
            )}
          >
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="font-headline text-xl">{s.title}</CardTitle>
                    {daysLeft <= 7 && daysLeft >= 0 && (
                      <DeadlineIndicator deadline={s.deadline} variant="badge" />
                    )}
                    {status && <StatusBadge status={status} />}
                  </div>
                  <CardDescription>{s.provider}</CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {onGenerateSummary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerateSummary(s)}
                      className="gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      title="Generate simplified Scholarship Application Summary PDF for your records"
                    >
                      <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Summary PDF</span>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onSelectScholarship(s)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5"/>
                    View Info
                  </Button>
                  <Button asChild size="sm" className="gap-1.5 font-medium">
                    <a
                      href={s.apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (!status) {
                          setStatus(s.id, "Applied", s.title);
                        }
                        toast({
                          title: `Redirecting to ${s.provider}`,
                          description: `Opening company scholarship site in a new tab. Status marked as 'Applied'!`,
                        });
                      }}
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="h-3.5 w-3.5"/>
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Track Status:</span>
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
              <div className="flex flex-wrap gap-2">
                {s.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
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
