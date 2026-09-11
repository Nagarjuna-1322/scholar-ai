"use client";

import type { Scholarship } from "@/lib/data";
import { daysUntil } from "@/lib/utils";
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
import { Calendar, Eye } from "lucide-react";
import { ScholarshipStatusTracker, StatusBadge } from "@/components/ScholarshipStatusTracker";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";

export function ScholarshipList({
  scholarships = [],
  onSelectScholarship,
}: {
  scholarships?: Scholarship[];
  onSelectScholarship: (scholarship: Scholarship) => void;
}) {
  const safeScholarships = Array.isArray(scholarships) ? scholarships : [];
  const { getStatus } = useApplicationTracker();

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
        return (
          <Card key={s.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="font-headline text-xl">{s.title}</CardTitle>
                    {status && <StatusBadge status={status} />}
                  </div>
                  <CardDescription>{s.provider}</CardDescription>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onSelectScholarship(s)}>
                  <Eye className="mr-2 h-4 w-4"/>
                  View Details
                </Button>
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
              <div className="flex items-center gap-2 text-muted-foreground shrink-0 ml-4">
                <Calendar className="h-4 w-4" />
                <span>{daysUntil(s.deadline)} days left</span>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
