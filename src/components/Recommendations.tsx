"use client";

import { useMemo } from "react";
import { useProfile, UserProfile } from "@/contexts/ProfileContext";
import { Scholarship, sampleScholarships } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

type ScoredScholarship = Scholarship & { score: number };

function recommendScholarships(user: UserProfile, list: Scholarship[]): ScoredScholarship[] {
  const scored = list.map((s) => {
    let score = 0;
    if (s.eligible_courses.includes(user.course)) score += 5;
    if (user.income <= s.income_limit) score += 4;
    if (user.marks_percent >= 85 && s.tags.includes("merit")) score += 3;
    if (s.tags.includes("stem") && user.course.toLowerCase().includes("bachelor")) score += 2;
    return { ...s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, 5);
}

export function Recommendations({ onSelectScholarship }: { onSelectScholarship: (scholarship: Scholarship) => void }) {
  const { profile, setProfileOpen } = useProfile();
  
  const recommendations = useMemo(() => {
    return recommendScholarships(profile, sampleScholarships);
  }, [profile]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <Lightbulb className="text-accent" />
          <span>Top Recommendations</span>
        </CardTitle>
        <CardDescription>Based on your current profile.</CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            <p>No specific recommendations found.</p>
            <Button variant="link" className="p-0 h-auto" onClick={() => setProfileOpen(true)}>
              Try editing your profile for better matches.
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((r) => (
              <div
                key={r.id}
                className="p-3 border rounded-lg hover:shadow-md hover:border-primary transition-all cursor-pointer"
                onClick={() => onSelectScholarship(r)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.provider}</p>
                  </div>
                  <Badge variant="secondary">Score: {r.score}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
