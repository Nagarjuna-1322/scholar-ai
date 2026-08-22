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

export function ScholarshipList({
  scholarships,
  onSelectScholarship,
}: {
  scholarships: Scholarship[];
  onSelectScholarship: (scholarship: Scholarship) => void;
}) {
  if (scholarships.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-lg border">
        <p className="text-lg font-semibold">No scholarships found</p>
        <p className="text-muted-foreground mt-1">Try adjusting your search query or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scholarships.map((s) => (
        <Card key={s.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="font-headline text-xl">{s.title}</CardTitle>
                <CardDescription>{s.provider}</CardDescription>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onSelectScholarship(s)}>
                <Eye className="mr-2 h-4 w-4"/>
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center text-sm">
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
      ))}
    </div>
  );
}
