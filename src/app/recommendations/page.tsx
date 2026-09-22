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
import { daysUntil, cn } from "@/lib/utils";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";

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
                      const daysLeft = daysUntil(r.deadline);

                      return (
                        <div
                            key={r.id}
                            className={cn(
                              "p-5 border rounded-xl hover:shadow-md transition-all flex flex-col justify-between bg-card",
                              daysLeft <= 3 && daysLeft >= 0 && "border-red-500/50 dark:border-red-600/50 shadow-sm shadow-red-500/10",
                              daysLeft > 3 && daysLeft <= 7 && "border-amber-500/50 dark:border-amber-600/50 shadow-sm shadow-amber-500/10",
                              daysLeft > 7 && "hover:border-primary/50"
                            )}
                        >
                            <div className="space-y-3">
                              {/* Top Row: Provider info + Score + Deadline Badge */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold text-base leading-snug">{r.title}</p>
                                      {status && <StatusBadge status={status} />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{r.provider}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {daysLeft <= 7 && daysLeft >= 0 && (
                                    <DeadlineIndicator deadline={r.deadline} variant="badge" />
                                  )}
                                  <Badge variant="secondary" className="font-medium text-xs">
                                    ★ Score: {r.score}
                                  </Badge>
                                </div>
                              </div>

                              {/* Amount & Category */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="font-semibold text-primary border-primary/40 bg-primary/5 text-xs">
                                  {r.amount}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className={
                                    r.category === "Government"
                                      ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20 text-[11px]"
                                      : "bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-600/20 text-[11px]"
                                  }
                                >
                                  {r.category === "Government" ? "🏛️ Govt Scheme" : "🏢 Private / CSR"}
                                </Badge>
                              </div>

                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.description}</p>

                              {/* Dynamic Color-Coded Deadline & Urgency Progress Bar */}
                              <div className="pt-1">
                                <DeadlineIndicator deadline={r.deadline} variant="detailed" />
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-wrap">
                              <Button size="sm" variant="outline" onClick={() => handleSelectScholarship(r)}>
                                <Eye className="mr-1.5 h-4 w-4"/> View Details
                              </Button>
                              <Button asChild size="sm" className="gap-1.5">
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
                                  <span>Apply on Portal</span>
                                  <ExternalLink className="h-3.5 w-3.5"/>
                                </a>
                              </Button>
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
