"use client";

import { useState, useTransition, useEffect } from "react";
import type { Scholarship } from "@/lib/data";
import { useProfile } from "@/contexts/ProfileContext";
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
import { Sparkles, Bot, Loader2, ArrowRight } from "lucide-react";

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
  const [explanation, setExplanation] = useState("");
  const [essay, setEssay] = useState("");
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

  if (!scholarship) return null;

  const daysLeft = daysUntil(scholarship.deadline);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-2xl font-headline">{scholarship.title}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-4 pt-1 text-sm text-muted-foreground">
              <span>{scholarship.provider}</span>
              <Badge variant={daysLeft < 30 ? "destructive" : "secondary"}>
                Deadline: {scholarship.deadline} ({daysLeft} days left)
              </Badge>
            </div>
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-6">
          <p className="text-sm text-foreground">{scholarship.description}</p>
          <div className="text-sm">
              <h4 className="font-semibold mb-2">Eligibility</h4>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>Eligible Courses: {scholarship.eligible_courses.join(", ")}</li>
                  <li>Max Family Income: ₹{scholarship.income_limit.toLocaleString()}</li>
              </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            {scholarship.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2"><Sparkles className="text-accent h-5 w-5" /> AI Tools</h4>
            
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
          </div>
        </div>
        <SheetFooter className="p-6 bg-card border-t mt-auto">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
           <a href={scholarship.apply_link} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button className="w-full">
                  Apply Now
                  <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
           </a>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
