"use client";

import { useState, useMemo, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { evaluateAndRankScholarships } from "@/lib/eligibilityEngine";
import { Scholarship } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Eye, ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import { StatusBadge } from "@/components/ScholarshipStatusTracker";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { useToast } from "@/hooks/use-toast";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";

export default function RecommendationsPage() {
  const { profile, setProfileOpen } = useProfile();
  const { scholarships } = useScholarships();
  const { getStatus, setStatus } = useApplicationTracker();
  const { toast } = useToast();

  const recommendations = useMemo(() => {
    return evaluateAndRankScholarships(profile, scholarships).filter(
      (item) => item.evaluation.status === "Eligible" || item.evaluation.status === "Possibly Eligible"
    );
  }, [profile, scholarships]);

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
        <h1 className="text-2xl sm:text-3xl font-bold font-headline">Top Personalized Matches</h1>
        <p className="text-sm text-muted-foreground">
          Scholarships ranked by deterministic Profile Compatibility Score for your academic, domicile, and income profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2 text-lg">
            <Lightbulb className="text-amber-500 h-5 w-5" />
            <span>Verified Matches for {profile.name || "You"}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Profile: {profile.course} ({profile.education_level || "UG"}) • Domicile: {profile.state} • Income: ₹{(profile.income ?? 0).toLocaleString("en-IN")} • Marks: {profile.marks_percent}% • Category: {profile.category}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              <p>No specific recommendations found for your current inputs.</p>
              <Button variant="link" className="p-0 h-auto" onClick={() => setProfileOpen(true)}>
                Update your profile criteria to unlock tailored matches.
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.map(({ scholarship: r, evaluation }) => {
                const status = getStatus(r.id);

                return (
                  <div
                    key={r.id}
                    className="p-5 border rounded-xl hover:shadow-md transition-all flex flex-col justify-between bg-card"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-base leading-snug">{r.title}</p>
                            {status && <StatusBadge status={status} />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r.provider} • {r.region}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {evaluation.status === "Eligible" ? (
                            <Badge className="bg-emerald-600 text-white font-mono text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {evaluation.compatibilityScore}% Eligible
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-600 text-white font-mono text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {evaluation.compatibilityScore}% Possible
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono font-semibold text-primary border-primary/40 bg-primary/5 text-xs">
                          ₹{r.amount.toLocaleString("en-IN")}/yr
                        </Badge>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          {r.verification_status || "Verified Source"}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {evaluation.summaryReason}
                      </p>

                      <div className="pt-1">
                        <DeadlineIndicator deadline={r.deadline} variant="detailed" />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => handleSelectScholarship(r)} className="text-xs">
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Full Breakdown & Checklist
                      </Button>
                      <Button asChild size="sm" className="gap-1.5 text-xs">
                        <a
                          href={r.apply_link || r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (!status || status === "Saved" || status === "Preparing Documents" || status === "Ready to Apply") {
                              setStatus(r.id, "Application Started", r.title);
                            }
                            toast({
                              title: `Opened ${r.provider} Official Portal`,
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
