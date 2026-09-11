"use client";

import { useState, useMemo, useEffect } from "react";
import { useProfile, UserProfile } from "@/contexts/ProfileContext";
import { Scholarship, sampleScholarships } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Eye, ExternalLink } from "lucide-react";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import { StatusBadge } from "@/components/ScholarshipStatusTracker";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { useToast } from "@/hooks/use-toast";

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
  return scored.filter((s) => s.score > 0);
}

export default function RecommendationsPage() {
  const { profile, setProfileOpen } = useProfile();
  const { getStatus, setStatus } = useApplicationTracker();
  const { toast } = useToast();
  
  const recommendations = useMemo(() => {
    return recommendScholarships(profile, sampleScholarships);
  }, [profile]);
  
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  
  useEffect(() => {
    if (!isDetailOpen) {
      setSelectedScholarship(null);
    }
  }, [isDetailOpen]);

  const handleSelectScholarship = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
  };


  return (
    <div className="space-y-8">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold">Top Recommendations</h1>
            <p className="text-muted-foreground">
                These scholarships are recommended based on your profile.
            </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                <Lightbulb className="text-accent" />
                <span>Recommendations for {profile.name || "you"}</span>
                </CardTitle>
                <CardDescription>
                    Based on your course: {profile.course}, income: ₹{profile.income.toLocaleString()}, and marks: {profile.marks_percent}%.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {recommendations.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                    <p>No specific recommendations found.</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => setProfileOpen(true)}>
                    Try editing your profile for better matches.
                    </Button>
                </div>
                ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {recommendations.map((r) => {
                      const status = getStatus(r.id);
                      return (
                        <div
                            key={r.id}
                            className="p-4 border rounded-lg hover:shadow-md hover:border-primary transition-all flex flex-col justify-between"
                        >
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold">{r.title}</p>
                                      {status && <StatusBadge status={status} />}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{r.provider}</p>
                                </div>
                                <Badge variant="secondary">Score: {r.score}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.description}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => handleSelectScholarship(r)}>
                                <Eye className="mr-1.5 h-4 w-4"/> View Details
                              </Button>
                              <a
                                href={r.apply_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  if (!status) {
                                    setStatus(r.id, "Applied", r.title);
                                  }
                                  toast({
                                    title: `Redirecting to ${r.provider}`,
                                    description: `Opening official portal in a new tab. Status marked as 'Applied'!`,
                                  });
                                }}
                              >
                                <Button size="sm" className="gap-1.5">
                                  <span>Apply on Portal</span>
                                  <ExternalLink className="h-3.5 w-3.5"/>
                                </Button>
                              </a>
                            </div>
                        </div>
                      );
                    })}
                </div>
                )}
            </CardContent>
        </Card>
        
        <ScholarshipDetail 
            scholarship={selectedScholarship} 
            isOpen={isDetailOpen}
            onOpenChange={setDetailOpen}
        />
    </div>
  );
}
