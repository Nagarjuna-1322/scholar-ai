"use client";

import { useState, useTransition } from "react";
import { sampleScholarships, type Scholarship } from "@/lib/data";
import { searchScholarshipsAction } from "@/app/actions";
import { ScholarshipList } from "@/components/ScholarshipList";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AIMatcher } from "@/components/AIMatcher";

export default function AIMatcherPage() {
  const { toast } = useToast();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  const handleSelectScholarship = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
  };

  const handleSearch = (query: string) => {
    setHasSearched(true);
    startSearchTransition(async () => {
      const result = await searchScholarshipsAction(query, sampleScholarships);
      if (Array.isArray(result) && "error" in result) {
        toast({
          variant: "destructive",
          title: "Search Error",
          description: (result as any).error,
        });
        setScholarships([]);
      } else {
        setScholarships(result as Scholarship[]);
      }
    });
  };
  
  const handleClear = () => {
    setScholarships([]);
    setHasSearched(false);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">AI Scholarship Matcher</h1>
        <p className="text-muted-foreground">
          Use natural language to find scholarships that fit your profile and needs.
        </p>
      </div>

      <AIMatcher isSearching={isSearching} onSearch={handleSearch} onClear={handleClear} />

      {isSearching ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : hasSearched ? (
        <ScholarshipList scholarships={scholarships} onSelectScholarship={handleSelectScholarship} />
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border">
          <p className="text-lg font-semibold">Ready to find your perfect scholarship?</p>
          <p className="text-muted-foreground mt-1">
            Type your query above to get started. For example: "merit-based scholarships for engineering".
          </p>
        </div>
      )}

      <ScholarshipDetail 
        scholarship={selectedScholarship} 
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
